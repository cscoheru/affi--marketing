package public

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/zenconsult/affi-marketing/internal/model/blog"
)

type BlogController struct {
	DB *gorm.DB
}

func NewBlogController(db *gorm.DB) *BlogController {
	return &BlogController{DB: db}
}

// GetPosts 获取公开文章列表
// @Summary 获取公开文章列表
// @Description 获取已发布的博客文章列表，支持分页和分类筛选
// @Tags 公开博客
// @Accept json
// @Produce json
// @Param page query int false "页码" default(1)
// @Param page_size query int false "每页数量" default(10)
// @Param category query string false "分类 slug"
// @Success 200 {object} blog.BlogPostListResponse
// @Router /api/public/blog/posts [get]
func (ctrl *BlogController) GetPosts(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	categorySlug := c.Query("category")

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 10
	}

	var posts []blog.BlogPost
	var total int64

	query := ctrl.DB.Model(&blog.BlogPost{}).
		Where("status = ?", "published").
		Where("published_at <= ?", time.Now())

	// 分类筛选
	if categorySlug != "" && categorySlug != "all" {
		var category blog.BlogCategory
		if err := ctrl.DB.Where("slug = ?", categorySlug).First(&category).Error; err == nil {
			query = query.Where("category_id = ?", category.ID)
		}
	}

	// 获取总数
	if err := query.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取文章失败"})
		return
	}

	// 获取文章列表
	offset := (page - 1) * pageSize
	if err := query.Preload("Category").
		Order("published_at DESC").
		Offset(offset).
		Limit(pageSize).
		Find(&posts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取文章失败"})
		return
	}

	totalPages := int(total) / pageSize
	if int(total)%pageSize != 0 {
		totalPages++
	}

	c.JSON(http.StatusOK, blog.BlogPostListResponse{
		Posts:      posts,
		Total:      total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	})
}

// GetPostBySlug 根据 slug 获取文章详情
// @Summary 获取文章详情
// @Description 根据 slug 获取已发布的博客文章详情
// @Tags 公开博客
// @Accept json
// @Produce json
// @Param slug path string true "文章 slug"
// @Success 200 {object} blog.BlogPost
// @Failure 404 {object} map[string]string
// @Router /api/public/blog/posts/{slug} [get]
func (ctrl *BlogController) GetPostBySlug(c *gin.Context) {
	slug := c.Param("slug")

	var post blog.BlogPost
	if err := ctrl.DB.Where("slug = ? AND status = ?", slug, "published").
		Where("published_at <= ?", time.Now()).
		Preload("Category").
		First(&post).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "文章未找到"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取文章失败"})
		return
	}

	// 增加浏览次数
	ctrl.DB.Model(&post).UpdateColumn("view_count", gorm.Expr("view_count + ?", 1))

	c.JSON(http.StatusOK, post)
}

// GetCategories 获取分类列表
// @Summary 获取分类列表
// @Description 获取所有博客分类及文章数量
// @Tags 公开博客
// @Accept json
// @Produce json
// @Success 200 {array} blog.BlogCategoryWithCount
// @Router /api/public/blog/categories [get]
func (ctrl *BlogController) GetCategories(c *gin.Context) {
	var categories []blog.BlogCategory

	if err := ctrl.DB.Order("name ASC").Find(&categories).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取分类失败"})
		return
	}

	// 获取每个分类的文章数量
	var result []blog.BlogCategoryWithCount
	for _, cat := range categories {
		var count int64
		ctrl.DB.Model(&blog.BlogPost{}).
			Where("category_id = ? AND status = ? AND published_at <= ?", cat.ID, "published", time.Now()).
			Count(&count)

		result = append(result, blog.BlogCategoryWithCount{
			BlogCategory: cat,
			PostCount:    int(count),
		})
	}

	c.JSON(http.StatusOK, result)
}

// GetSitemap 获取站点地图
// @Summary 获取站点地图
// @Description 生成 XML 格式的站点地图
// @Tags 公开博客
// @Produce xml
// @Success 200 {string} string "XML"
// @Router /api/public/blog/sitemap.xml [get]
func (ctrl *BlogController) GetSitemap(c *gin.Context) {
	var posts []blog.BlogPost

	if err := ctrl.DB.Where("status = ?", "published").
		Where("published_at <= ?", time.Now()).
		Order("published_at DESC").
		Find(&posts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "生成站点地图失败"})
		return
	}

	// 生成 XML
	sitemap := `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://yourdomain.com/blog</loc>
    <lastmod>` + time.Now().Format("2006-01-02") + `</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`

	for _, post := range posts {
		lastmod := post.UpdatedAt.Format("2006-01-02")
		sitemap += `
  <url>
    <loc>https://yourdomain.com/blog/` + post.Slug + `</loc>
    <lastmod>` + lastmod + `</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
	}

	sitemap += `
</urlset>`

	c.Data(http.StatusOK, "application/xml", []byte(sitemap))
}

// GetFeaturedPosts 获取精选文章
// @Summary 获取精选文章
// @Description 获取置顶或精选的文章列表
// @Tags 公开博客
// @Accept json
// @Produce json
// @Param limit query int false "数量限制" default(3)
// @Success 200 {array} blog.BlogPost
// @Router /api/public/blog/featured [get]
func (ctrl *BlogController) GetFeaturedPosts(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "3"))
	if limit < 1 || limit > 10 {
		limit = 3
	}

	var posts []blog.BlogPost
	if err := ctrl.DB.Where("status = ?", "published").
		Where("published_at <= ?", time.Now()).
		Order("view_count DESC, published_at DESC").
		Limit(limit).
		Preload("Category").
		Find(&posts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取精选文章失败"})
		return
	}

	c.JSON(http.StatusOK, posts)
}
