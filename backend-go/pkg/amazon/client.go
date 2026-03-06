package amazon

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"sort"
	"strings"
	"time"

	"github.com/go-resty/resty/v2"
)

// Config Amazon API配置
type Config struct {
	AccessKey    string
	SecretKey    string
	AssociateTag string
	Region       string // us, uk, de, jp, etc.
	PartnerType  string // Associates
}

// Client Amazon Product Advertising API客户端
type Client struct {
	config     *Config
	httpClient *resty.Client
	host       string
	endpoint   string
}

// ProductInfo 产品信息
type ProductInfo struct {
	ASIN        string   `json:"asin"`
	Title       string   `json:"title"`
	Price       float64  `json:"price"`
	Currency    string   `json:"currency"`
	ImageURL    string   `json:"imageUrl"`
	Rating      float64  `json:"rating"`
	ReviewCount int      `json:"reviewCount"`
	Category    string   `json:"category"`
	Description string   `json:"description"`
	Features    []string `json:"features"`
	URL         string   `json:"url"`
	SalesRank   int      `json:"salesRank"`
}

// SearchItem 搜索结果项
type SearchItem struct {
	ASIN        string  `json:"asin"`
	Title       string  `json:"title"`
	Price       float64 `json:"price"`
	Currency    string  `json:"currency"`
	ImageURL    string  `json:"imageUrl"`
	Rating      float64 `json:"rating"`
	ReviewCount int     `json:"reviewCount"`
	Category    string  `json:"category"`
	URL         string  `json:"url"`
}

// NewClient 创建Amazon API客户端
func NewClient(cfg *Config) *Client {
	regionHosts := map[string]string{
		"us": "webservices.amazon.com",
		"uk": "webservices.amazon.co.uk",
		"de": "webservices.amazon.de",
		"jp": "webservices.amazon.co.jp",
		"fr": "webservices.amazon.fr",
		"ca": "webservices.amazon.ca",
	}

	host := regionHosts[cfg.Region]
	if host == "" {
		host = "webservices.amazon.com"
	}

	httpClient := resty.New().
		SetTimeout(30 * time.Second).
		SetRetryCount(2).
		SetRetryWaitTime(1 * time.Second)

	return &Client{
		config:     cfg,
		httpClient: httpClient,
		host:       host,
		endpoint:   fmt.Sprintf("https://%s/paapi5/getitems", host),
	}
}

// GetItem 获取单个产品信息
func (c *Client) GetItem(asin string) (*ProductInfo, error) {
	items, err := c.GetItems([]string{asin})
	if err != nil {
		return nil, err
	}
	if len(items) == 0 {
		return nil, fmt.Errorf("product not found: %s", asin)
	}
	return items[0], nil
}

// GetItems 批量获取产品信息
func (c *Client) GetItems(asins []string) ([]*ProductInfo, error) {
	if len(asins) == 0 {
		return []*ProductInfo{}, nil
	}
	if len(asins) > 10 {
		asins = asins[:10]
	}

	// 构建请求
	requestBody := map[string]interface{}{
		"ItemIds": asins,
		"Resources": []string{
			"ItemInfo.Title",
			"ItemInfo.Features",
			"Offers.Listings.Price",
			"CustomerReviews.StarRating",
			"CustomerReviews.Count",
			"Images.Primary.Medium",
			"BrowseNodeInfo.BrowseNodes",
		},
		"PartnerTag":   c.config.AssociateTag,
		"PartnerType":  "Associates",
		"Marketplace":  c.getMarketplace(),
	}

	bodyBytes, err := json.Marshal(requestBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	// 构建签名
	headers := c.buildHeaders("GetItems", bodyBytes)

	// 发送请求
	resp, err := c.httpClient.R().
		SetHeaders(headers).
		SetBody(bodyBytes).
		Post(c.endpoint)

	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}

	// 解析响应
	var result struct {
		ItemsResult struct {
			Items []struct {
				ASIN     string `json:"ASIN"`
				ItemInfo struct {
					Title struct {
						DisplayValue string `json:"DisplayValue"`
					} `json:"Title"`
					Features struct {
						DisplayValues []string `json:"DisplayValues"`
					} `json:"Features"`
				} `json:"ItemInfo"`
				Offers struct {
					Listings []struct {
						Price struct {
							Amount   float64 `json:"Amount"`
							Currency string `json:"Currency"`
						} `json:"Price"`
					} `json:"Listings"`
				} `json:"Offers"`
				CustomerReviews struct {
					StarRating struct {
						Value float64 `json:"Value"`
					} `json:"StarRating"`
					Count struct {
						Value int `json:"Value"`
					} `json:"Count"`
				} `json:"CustomerReviews"`
				Images struct {
					Primary struct {
						Medium struct {
							URL string `json:"URL"`
						} `json:"Medium"`
					} `json:"Primary"`
				} `json:"Images"`
				BrowseNodeInfo struct {
					BrowseNodes []struct {
						DisplayName string `json:"DisplayName"`
					} `json:"BrowseNodes"`
				} `json:"BrowseNodeInfo"`
				DetailPageURL string `json:"DetailPageURL"`
			} `json:"Items"`
		} `json:"ItemsResult"`
		Errors []struct {
			Code    string `json:"Code"`
			Message string `json:"Message"`
		} `json:"Errors,omitempty"`
	}

	if err := json.Unmarshal(resp.Body(), &result); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	if len(result.Errors) > 0 {
		return nil, fmt.Errorf("API error: %s - %s", result.Errors[0].Code, result.Errors[0].Message)
	}

	// 转换为ProductInfo
	var products []*ProductInfo
	for _, item := range result.ItemsResult.Items {
		product := &ProductInfo{
			ASIN:  item.ASIN,
			Title: item.ItemInfo.Title.DisplayValue,
			URL:   item.DetailPageURL,
		}

		// 价格
		if len(item.Offers.Listings) > 0 {
			product.Price = item.Offers.Listings[0].Price.Amount
			product.Currency = item.Offers.Listings[0].Price.Currency
		}

		// 图片
		if item.Images.Primary.Medium.URL != "" {
			product.ImageURL = item.Images.Primary.Medium.URL
		}

		// 评分和评论数
		if item.CustomerReviews.StarRating.Value > 0 {
			product.Rating = item.CustomerReviews.StarRating.Value
		}
		if item.CustomerReviews.Count.Value > 0 {
			product.ReviewCount = item.CustomerReviews.Count.Value
		}

		// 分类
		if len(item.BrowseNodeInfo.BrowseNodes) > 0 {
			product.Category = item.BrowseNodeInfo.BrowseNodes[0].DisplayName
		}

		// 特性
		if len(item.ItemInfo.Features.DisplayValues) > 0 {
			product.Features = item.ItemInfo.Features.DisplayValues
		}

		products = append(products, product)
	}

	return products, nil
}

// getMarketplace 获取市场ID
func (c *Client) getMarketplace() string {
	marketplaces := map[string]string{
		"us": "ATVPDKIKX0DER",
		"uk": "A1F83G0BH5T9Z",
		"de": "A1PA6795UKM0A5",
		"jp": "A1VCVHF7F7DD9",
		"fr": "A13Q6K0L5N9RA",
		"ca": "A2EUQ1NZ0TZC1",
	}
	return marketplaces[c.config.Region]
}

// buildHeaders 构建AWS签名headers
func (c *Client) buildHeaders(operation string, body []byte) map[string]string {
	now := time.Now().UTC()
	amzDate := now.Format("20060102T150405Z")
	dateStamp := now.Format("20060102")

	// AWS Signature v4
	service := "ProductAdvertisingAPI"
	region := c.config.Region

	// 计算签名
	credentialScope := fmt.Sprintf("%s/%s/%s/aws4_request", dateStamp, region, service)
	stringToSign := fmt.Sprintf("AWS4-HMAC-SHA256\n%s\n%s\nhost:%s\nx-amz-date:%s\nx-amz-target:com.amazon.paapi5.v1.%s\n\nhost;x-amz-date;x-amz-target\n%s",
		amzDate,
		credentialScope,
		c.host,
		amzDate,
		operation,
		sha256Hash(string(body)),
	)

	// 计算签名密钥
	kDate := hmacSHA256([]byte("AWS4"+c.config.SecretKey), dateStamp)
	kRegion := hmacSHA256(kDate, region)
	kService := hmacSHA256(kRegion, service)
	kSigning := hmacSHA256(kService, "aws4_request")
	signature := hex.EncodeToString(hmacSHA256(kSigning, stringToSign))

	return map[string]string{
		"Host":           c.host,
		"Content-Type":   "application/json; charset=utf-8",
		"X-Amz-Target":   fmt.Sprintf("com.amazon.paapi5.v1.%s", operation),
		"X-Amz-Date":     amzDate,
		"Authorization":  fmt.Sprintf("AWS4-HMAC-SHA256 Credential=%s/%s, SignedHeaders=host;x-amz-date;x-amz-target, Signature=%s", c.config.AccessKey, credentialScope, signature),
	}
}

// hmacSHA256 计算HMAC-SHA256签名
func hmacSHA256(key []byte, data string) []byte {
	h := hmac.New(sha256.New, key)
	h.Write([]byte(data))
	return h.Sum(nil)
}

// sha256Hash 计算SHA256哈希
func sha256Hash(data string) string {
	h := sha256.New()
	h.Write([]byte(data))
	return hex.EncodeToString(h.Sum(nil))
}

// buildStringToCanonical 将字符串转换为规范格式
func buildString(sortedKeys []string, sortedValues []string) string {
	var sb strings.Builder
	for i := 0; i < len(sortedKeys); i++ {
		if i > 0 {
			sb.WriteByte('&')
		}
		sb.WriteString(sortedKeys[i])
		sb.WriteByte('=')
		sb.WriteString(sortedValues[i])
	}
	return sb.String()
}

// buildCanonicalQueryString 将map转换为规范查询字符串
func buildCanonicalQueryString(params map[string]string) string {
	var keys []string
	for k := range params {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	var sortedKeys []string
	var sortedValues []string
	for _, k := range keys {
		sortedKeys = append(sortedKeys, k)
		sortedValues = append(sortedValues, params[k])
	}

	return buildString(sortedKeys, sortedValues)
}

// ========== 备用：第三方API (Rainforest) ==========

// RainforestClient 第三方API客户端
type RainforestClient struct {
	apiKey     string
	httpClient *resty.Client
}

// NewRainforestClient 创建Rainforest客户端
func NewRainforestClient(apiKey string) *RainforestClient {
	return &RainforestClient{
		apiKey: apiKey,
		httpClient: resty.New().SetTimeout(30 * time.Second),
	}
}

// GetProduct 获取产品信息 (Rainforest API)
func (c *RainforestClient) GetProduct(asin string) (*ProductInfo, error) {
	resp, err := c.httpClient.R().
		SetQueryParam("api_key", c.apiKey).
		SetQueryParam("type", "product").
		SetQueryParam("amazon_domain", "amazon.com").
		SetQueryParam("asin", asin).
		Get("https://api.rainforestapi.com/request")

	if err != nil {
		return nil, err
	}

	var result struct {
		Product struct {
			Title       string  `json:"title"`
			Price       float64 `json:"price_value"`
			Currency    string  `json:"currency"`
			Image       string  `json:"main_image"`
			Rating      float64 `json:"rating"`
			NumReviews  int     `json:"total_reviews"`
			Category    string  `json:"category"`
			Link        string  `json:"link"`
		} `json:"product"`
	}

	if err := json.Unmarshal(resp.Body(), &result); err != nil {
		return nil, err
	}

	return &ProductInfo{
		ASIN:        asin,
		Title:       result.Product.Title,
		Price:       result.Product.Price,
		Currency:    result.Product.Currency,
		ImageURL:    result.Product.Image,
		Rating:      result.Product.Rating,
		ReviewCount: result.Product.NumReviews,
		Category:    result.Product.Category,
		URL:         result.Product.Link,
	}, nil
}

// ========== 模拟客户端（用于开发测试） ==========

// MockClient 模拟客户端
type MockClient struct{}

// NewMockClient 创建模拟客户端
func NewMockClient() *MockClient {
	return &MockClient{}
}

// GetItem 获取模拟产品信息
func (c *MockClient) GetItem(asin string) (*ProductInfo, error) {
	// 模拟数据
	mockProducts := map[string]*ProductInfo{
		"B08N5KWB9H": {
			ASIN:        "B08N5KWB9H",
			Title:       "Sony WH-1000XM4 Wireless Noise Cancelling Headphones",
			Price:       349.99,
			Currency:    "USD",
			ImageURL:    "https://m.media-amazon.com/images/I/71L2K9m9URL._AC_SL1500_.jpg",
			Rating:      4.7,
			ReviewCount: 45230,
			Category:    "Electronics",
			Description: "Industry-leading noise cancellation with Dual Noise Sensor technology",
			Features: []string{
				"Industry-leading noise cancellation",
				"Up to 30 hours of battery life",
				"Premium sound quality",
			},
			URL: fmt.Sprintf("https://www.amazon.com/dp/%s", asin),
		},
		"B0BDHB9Y8M": {
			ASIN:        "B0BDHB9Y8M",
			Title:       "Apple AirPods Pro (2nd Generation)",
			Price:       249.00,
			Currency:    "USD",
			ImageURL:    "https://m.media-amazon.com/images/I/71E0PH8YIDL._AC_SL1500_.jpg",
			Rating:      4.6,
			ReviewCount: 89450,
			Category:    "Electronics",
			Description: "Active Noise Cancellation, Transparency mode. Personalized Spatial Audio.",
			Features: []string{
				"Active Noise Cancellation",
				"Personalized Spatial Audio",
				"MagSafe Charging Case",
			},
			URL: fmt.Sprintf("https://www.amazon.com/dp/%s", asin),
		},
		"B0CHX2F5QT": {
			ASIN:        "B0CHX2F5QT",
			Title:       "Anker Portable Charger 26800mAh",
			Price:       65.99,
			Currency:    "USD",
			ImageURL:    "https://m.media-amazon.com/images/I/71E0PH8YIDL._AC_SL1500_.jpg",
			Rating:      4.8,
			ReviewCount: 128000,
			Category:    "Electronics",
			Description: "High capacity portable charger with fast charging",
			Features: []string{
				"26800mAh capacity",
				"Fast charging support",
				"Compact design",
			},
			URL: fmt.Sprintf("https://www.amazon.com/dp/%s", asin),
		},
	}

	if product, ok := mockProducts[asin]; ok {
		return product, nil
	}

	// 生成通用模拟数据
	return &ProductInfo{
		ASIN:        asin,
		Title:       fmt.Sprintf("Product %s", asin),
		Price:       99.99,
		Currency:    "USD",
		ImageURL:    "",
		Rating:      4.5,
		ReviewCount: 1000,
		Category:    "General",
		URL:         fmt.Sprintf("https://www.amazon.com/dp/%s", asin),
	}, nil
}

// GetItems 批量获取模拟产品信息
func (c *MockClient) GetItems(asins []string) ([]*ProductInfo, error) {
	var products []*ProductInfo
	for _, asin := range asins {
		product, err := c.GetItem(asin)
		if err != nil {
			return nil, err
		}
		products = append(products, product)
	}
	return products, nil
}

// SearchProducts 模拟搜索
func (c *MockClient) SearchProducts(keywords string, page int) ([]*SearchItem, error) {
	return []*SearchItem{
		{
			ASIN:        "B08N5KWB9H",
			Title:       "Sony WH-1000XM4 Wireless Noise Cancelling Headphones",
			Price:       349.99,
			Currency:    "USD",
			ImageURL:    "https://m.media-amazon.com/images/I/71L2K9m9URL._AC_SL1500_.jpg",
			Rating:      4.7,
			ReviewCount: 45230,
			URL:         "https://www.amazon.com/dp/B08N5KWB9H",
		},
		{
			ASIN:        "B0BDHB9Y8M",
			Title:       "Apple AirPods Pro (2nd Generation)",
			Price:       249.00,
			Currency:    "USD",
			ImageURL:    "https://m.media-amazon.com/images/I/71E0PH8YIDL._AC_SL1500_.jpg",
			Rating:      4.6,
			ReviewCount: 89450,
			URL:         "https://www.amazon.com/dp/B0BDHB9Y8M",
		},
	}, nil
}
