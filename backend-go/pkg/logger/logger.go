package logger

import (
	"fmt"
	"os"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"

	"github.com/zenconsult/affi-marketing/internal/config"
)

var (
	globalLogger *zap.Logger
	sugarLogger  *zap.SugaredLogger
)

// Init 初始化日志系统
func Init(cfg *config.LogConfig) error {
	var err error

	// 配置编码器
	encoderConfig := zapcore.EncoderConfig{
		TimeKey:        "timestamp",
		LevelKey:       "level",
		NameKey:        "logger",
		CallerKey:      "caller",
		FunctionKey:    zapcore.OmitKey,
		MessageKey:     "msg",
		StacktraceKey:  "stacktrace",
		LineEnding:     zapcore.DefaultLineEnding,
		EncodeLevel:    zapcore.LowercaseLevelEncoder,
		EncodeTime:     zapcore.ISO8601TimeEncoder,
		EncodeDuration: zapcore.SecondsDurationEncoder,
		EncodeCaller:   zapcore.ShortCallerEncoder,
	}

	// 解析日志级别
	level, err := zapcore.ParseLevel(cfg.Level)
	if err != nil {
		level = zapcore.InfoLevel
	}

	// 创建输出
	var writer zapcore.WriteSyncer
	switch cfg.Output {
	case "stdout":
		writer = zapcore.AddSync(os.Stdout)
	case "stderr":
		writer = zapcore.AddSync(os.Stderr)
	default:
		// 写入文件
		file, err := os.OpenFile(cfg.Output, os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0644)
		if err != nil {
			return fmt.Errorf("failed to open log file: %w", err)
		}
		writer = zapcore.AddSync(file)
	}

	// 配置编码器
	var encoder zapcore.Encoder
	if cfg.Format == "json" {
		encoder = zapcore.NewJSONEncoder(encoderConfig)
	} else {
		encoder = zapcore.NewConsoleEncoder(encoderConfig)
	}

	// 创建核心
	core := zapcore.NewCore(encoder, writer, level)

	// 创建 logger
	globalLogger = zap.New(core, zap.AddCaller(), zap.AddStacktrace(zapcore.ErrorLevel))
	sugarLogger = globalLogger.Sugar()

	return nil
}

// L 获取全局 logger
func L() *zap.Logger {
	if globalLogger == nil {
		// 初始化默认 logger
		_ = Init(&config.LogConfig{
			Level:  "info",
			Output: "stdout",
			Format: "json",
		})
	}
	return globalLogger
}

// S 获取全局 sugared logger
func S() *zap.SugaredLogger {
	if sugarLogger == nil {
		sugarLogger = L().Sugar()
	}
	return sugarLogger
}

// Sync 同步日志缓冲区
func Sync() error {
	if globalLogger != nil {
		return globalLogger.Sync()
	}
	return nil
}

// Debug 快捷日志方法
func Debug(msg string, fields ...zap.Field) {
	L().Debug(msg, fields...)
}

// Info 快捷日志方法
func Info(msg string, fields ...zap.Field) {
	L().Info(msg, fields...)
}

// Warn 快捷日志方法
func Warn(msg string, fields ...zap.Field) {
	L().Warn(msg, fields...)
}

// Error 快捷日志方法
func Error(msg string, fields ...zap.Field) {
	L().Error(msg, fields...)
}

// Fatal 快捷日志方法
func Fatal(msg string, fields ...zap.Field) {
	L().Fatal(msg, fields...)
}

// With 创建带字段的 logger
func With(fields ...zap.Field) *zap.Logger {
	return L().With(fields...)
}
