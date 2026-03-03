"""
Utility Helper Functions
"""
import re
import hashlib
from typing import Optional, List
from datetime import datetime


def sanitize_filename(filename: str) -> str:
    """Sanitize filename for safe file system usage"""
    # Remove invalid characters
    filename = re.sub(r'[<>:"/\\|?*]', '', filename)
    # Replace spaces with underscores
    filename = filename.replace(' ', '_')
    # Limit length
    return filename[:255]


def generate_cache_key(prefix: str, *args, **kwargs) -> str:
    """Generate consistent cache key from arguments"""
    key_parts = [prefix] + [str(arg) for arg in args]
    key_parts.extend(f"{k}={v}" for k, v in sorted(kwargs.items()))
    key_string = ":".join(key_parts)
    return hashlib.md5(key_string.encode()).hexdigest()


def truncate_text(text: str, max_length: int, suffix: str = "...") -> str:
    """Truncate text to max length with suffix"""
    if len(text) <= max_length:
        return text
    return text[:max_length - len(suffix)] + suffix


def extract_urls(text: str) -> List[str]:
    """Extract all URLs from text"""
    url_pattern = r'https?://[^\s<>"{}|\\^`\[\]]+'
    return re.findall(url_pattern, text)


def is_valid_url(url: str) -> bool:
    """Check if string is a valid URL"""
    url_pattern = re.compile(
        r'^https?://'  # http:// or https://
        r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|'  # domain
        r'localhost|'  # localhost
        r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'  # ip
        r'(?::\d+)?'  # optional port
        r'(?:/?|[/?]\S+)$', re.IGNORECASE
    )
    return url_pattern.match(url) is not None


def clean_html(html: str) -> str:
    """Remove HTML tags from string"""
    clean = re.compile('<.*?>')
    return re.sub(clean, '', html)


def count_words(text: str) -> int:
    """Count words in text (works for English and Chinese)"""
    # For Chinese, count characters (excluding spaces and punctuation)
    chinese_chars = len(re.findall(r'[\u4e00-\u9fff]', text))
    # For English, count words
    english_words = len(re.findall(r'\b[a-zA-Z]+\b', text))
    return chinese_chars + english_words


def format_duration(seconds: float) -> str:
    """Format duration in human-readable format"""
    if seconds < 1:
        return f"{seconds * 1000:.0f}ms"
    elif seconds < 60:
        return f"{seconds:.1f}s"
    elif seconds < 3600:
        minutes = seconds / 60
        return f"{minutes:.1f}m"
    else:
        hours = seconds / 3600
        return f"{hours:.1f}h"


def format_cost(cost: float) -> str:
    """Format cost in human-readable format"""
    if cost < 0.01:
        return f"${cost * 1000:.2f}/1k"
    elif cost < 1:
        return f"${cost:.3f}"
    else:
        return f"${cost:.2f}"


def timestamp() -> str:
    """Get current timestamp string"""
    return datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')


def merge_dicts(*dicts: dict) -> dict:
    """Merge multiple dictionaries recursively"""
    result = {}
    for d in dicts:
        for key, value in d.items():
            if key in result and isinstance(result[key], dict) and isinstance(value, dict):
                result[key] = merge_dicts(result[key], value)
            else:
                result[key] = value
    return result


def chunk_list(items: List, chunk_size: int) -> List[List]:
    """Split list into chunks"""
    return [items[i:i + chunk_size] for i in range(0, len(items), chunk_size)]


def retry_with_backoff(
    func,
    max_retries: int = 3,
    base_delay: float = 1.0,
    max_delay: float = 60.0,
):
    """Retry function with exponential backoff"""
    import time
    import random

    for attempt in range(max_retries):
        try:
            return func()
        except Exception as e:
            if attempt == max_retries - 1:
                raise

            # Calculate delay with exponential backoff and jitter
            delay = min(base_delay * (2 ** attempt) + random.uniform(0, 1), max_delay)
            time.sleep(delay)


def safe_cast(value, target_type, default=None):
    """Safely cast value to target type"""
    try:
        return target_type(value)
    except (ValueError, TypeError):
        return default
