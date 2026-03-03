"""
Cost Tracking and Monitoring Service
"""
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from dataclasses import dataclass, field, asdict
from collections import defaultdict
from loguru import logger
from pathlib import Path

from app.config import settings


@dataclass
class CostRecord:
    """Individual cost record"""
    timestamp: datetime
    model: str
    provider: str
    tier: str
    input_tokens: int
    output_tokens: int
    total_tokens: int
    cost: float
    request_type: str  # content_generation, keyword_analysis, etc.
    metadata: Dict = field(default_factory=dict)


@dataclass
class DailyCostSummary:
    """Daily cost summary"""
    date: str
    total_cost: float
    total_tokens: int
    total_requests: int
    by_model: Dict[str, float]
    by_tier: Dict[str, float]
    by_request_type: Dict[str, float]


@dataclass
class CostAlert:
    """Cost alert configuration"""
    threshold_type: str  # daily, weekly, monthly
    threshold_amount: float
    alert_email: Optional[str] = None
    alert_webhook: Optional[str] = None
    enabled: bool = True


class CostTracker:
    """Track and monitor AI service costs"""

    def __init__(self, storage_path: Optional[Path] = None):
        self.storage_path = storage_path or Path(settings.COST_LOG_PATH)
        self.storage_path.parent.mkdir(parents=True, exist_ok=True)

        self.records: List[CostRecord] = []
        self.daily_summaries: Dict[str, DailyCostSummary] = {}
        self.alerts: List[CostAlert] = []

        # Load existing data
        self._load_records()

        # Initialize default alerts
        self._initialize_default_alerts()

    def _load_records(self):
        """Load cost records from storage"""
        if not self.storage_path.exists():
            return

        try:
            with open(self.storage_path, 'r', encoding='utf-8') as f:
                data = json.load(f)

            for record_data in data.get('records', []):
                record_data['timestamp'] = datetime.fromisoformat(record_data['timestamp'])
                self.records.append(CostRecord(**record_data))

            for date, summary_data in data.get('summaries', {}).items():
                self.daily_summaries[date] = DailyCostSummary(**summary_data)

            logger.info(f"Loaded {len(self.records)} cost records")

        except Exception as e:
            logger.error(f"Error loading cost records: {e}")

    def _save_records(self):
        """Save cost records to storage"""
        try:
            data = {
                'records': [
                    {
                        **asdict(record),
                        'timestamp': record.timestamp.isoformat()
                    }
                    for record in self.records
                ],
                'summaries': {
                    date: asdict(summary)
                    for date, summary in self.daily_summaries.items()
                }
            }

            with open(self.storage_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)

        except Exception as e:
            logger.error(f"Error saving cost records: {e}")

    def _initialize_default_alerts(self):
        """Initialize default cost alerts"""
        self.alerts = [
            CostAlert(
                threshold_type="daily",
                threshold_amount=settings.DAILY_BUDGET * 0.8,  # 80% of daily budget
                enabled=True,
            ),
            CostAlert(
                threshold_type="weekly",
                threshold_amount=settings.DAILY_BUDGET * 7 * 0.7,  # 70% of weekly budget
                enabled=True,
            ),
        ]

    def record_cost(
        self,
        model: str,
        provider: str,
        tier: str,
        input_tokens: int,
        output_tokens: int,
        cost: float,
        request_type: str,
        metadata: Optional[Dict] = None
    ):
        """Record a cost event"""
        record = CostRecord(
            timestamp=datetime.utcnow(),
            model=model,
            provider=provider,
            tier=tier,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            total_tokens=input_tokens + output_tokens,
            cost=cost,
            request_type=request_type,
            metadata=metadata or {},
        )

        self.records.append(record)

        # Update daily summary
        date_str = record.timestamp.strftime('%Y-%m-%d')
        self._update_daily_summary(date_str, record)

        # Check alerts
        self._check_alerts()

        # Save to disk
        self._save_records()

        logger.debug(f"Recorded cost: ${cost:.4f} for {model} ({request_type})")

    def _update_daily_summary(self, date_str: str, record: CostRecord):
        """Update daily cost summary"""
        if date_str not in self.daily_summaries:
            self.daily_summaries[date_str] = DailyCostSummary(
                date=date_str,
                total_cost=0.0,
                total_tokens=0,
                total_requests=0,
                by_model=defaultdict(float),
                by_tier=defaultdict(float),
                by_request_type=defaultdict(float),
            )

        summary = self.daily_summaries[date_str]
        summary.total_cost += record.cost
        summary.total_tokens += record.total_tokens
        summary.total_requests += 1
        summary.by_model[record.model] += record.cost
        summary.by_tier[record.tier] += record.cost
        summary.by_request_type[record.request_type] += record.cost

    def _check_alerts(self):
        """Check if any cost thresholds are exceeded"""
        now = datetime.utcnow()

        for alert in self.alerts:
            if not alert.enabled:
                continue

            if alert.threshold_type == "daily":
                threshold_date = now.strftime('%Y-%m-%d')
                if threshold_date in self.daily_summaries:
                    current_cost = self.daily_summaries[threshold_date].total_cost
                    if current_cost >= alert.threshold_amount:
                        self._trigger_alert(alert, current_cost, threshold_date)

            elif alert.threshold_type == "weekly":
                week_start = now - timedelta(days=now.weekday())
                weekly_cost = sum(
                    summary.total_cost
                    for date, summary in self.daily_summaries.items()
                    if datetime.fromisoformat(date) >= week_start
                )
                if weekly_cost >= alert.threshold_amount:
                    self._trigger_alert(alert, weekly_cost, "this week")

    def _trigger_alert(self, alert: CostAlert, current_cost: float, period: str):
        """Trigger cost alert"""
        message = f"⚠️ Cost Alert: ${current_cost:.2f} spent {period}, exceeding threshold of ${alert.threshold_amount:.2f}"

        logger.warning(message)

        # Send email if configured
        if alert.alert_email:
            # TODO: Implement email notification
            pass

        # Send webhook if configured
        if alert.alert_webhook:
            # TODO: Implement webhook notification
            pass

    def get_cost_summary(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict:
        """Get cost summary for a date range"""
        if not start_date:
            start_date = datetime.utcnow() - timedelta(days=30)
        if not end_date:
            end_date = datetime.utcnow()

        filtered_records = [
            record for record in self.records
            if start_date <= record.timestamp <= end_date
        ]

        total_cost = sum(record.cost for record in filtered_records)
        total_tokens = sum(record.total_tokens for record in filtered_records)
        total_requests = len(filtered_records)

        by_model: Dict[str, float] = defaultdict(float)
        by_tier: Dict[str, float] = defaultdict(float)
        by_provider: Dict[str, float] = defaultdict(float)

        for record in filtered_records:
            by_model[record.model] += record.cost
            by_tier[record.tier] += record.cost
            by_provider[record.provider] += record.cost

        return {
            "period": {
                "start": start_date.isoformat(),
                "end": end_date.isoformat(),
            },
            "summary": {
                "total_cost": total_cost,
                "total_tokens": total_tokens,
                "total_requests": total_requests,
                "avg_cost_per_request": total_cost / total_requests if total_requests > 0 else 0,
            },
            "breakdown": {
                "by_model": dict(by_model),
                "by_tier": dict(by_tier),
                "by_provider": dict(by_provider),
            },
        }

    def get_daily_costs(self, days: int = 30) -> List[Dict]:
        """Get daily costs for the last N days"""
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)

        daily_costs = []
        for date_str, summary in self.daily_summaries.items():
            record_date = datetime.fromisoformat(date_str)
            if start_date <= record_date <= end_date:
                daily_costs.append({
                    "date": date_str,
                    "cost": summary.total_cost,
                    "tokens": summary.total_tokens,
                    "requests": summary.total_requests,
                })

        return sorted(daily_costs, key=lambda x: x["date"])

    def get_model_costs(self, model: str) -> Dict:
        """Get cost statistics for a specific model"""
        model_records = [r for r in self.records if r.model == model]

        if not model_records:
            return {"error": "No records found for this model"}

        total_cost = sum(r.cost for r in model_records)
        total_tokens = sum(r.total_tokens for r in model_records)
        avg_cost_per_1k = (total_cost / total_tokens) * 1000 if total_tokens > 0 else 0

        return {
            "model": model,
            "total_requests": len(model_records),
            "total_cost": total_cost,
            "total_tokens": total_tokens,
            "avg_cost_per_1k_tokens": avg_cost_per_1k,
            "first_used": min(r.timestamp for r in model_records).isoformat(),
            "last_used": max(r.timestamp for r in model_records).isoformat(),
        }

    def get_cost_forecast(self, days: int = 30) -> Dict:
        """Generate cost forecast based on historical data"""
        recent_days = min(7, len(self.daily_summaries))  # Use last 7 days

        if recent_days == 0:
            return {"error": "Not enough data for forecast"}

        # Calculate average daily cost
        recent_summaries = sorted(
            self.daily_summaries.items(),
            key=lambda x: x[0],
            reverse=True
        )[:recent_days]

        avg_daily_cost = sum(s.total_cost for _, s in recent_summaries) / recent_days
        avg_daily_tokens = sum(s.total_tokens for _, s in recent_summaries) / recent_days

        # Project for specified period
        forecast_cost = avg_daily_cost * days
        forecast_tokens = int(avg_daily_tokens * days)

        return {
            "forecast_period_days": days,
            "based_on_days": recent_days,
            "projections": {
                "estimated_cost": forecast_cost,
                "estimated_tokens": forecast_tokens,
                "estimated_requests": int(len(self.records) / max(len(self.daily_summaries), 1) * days),
            },
            "averages": {
                "daily_cost": avg_daily_cost,
                "daily_tokens": avg_daily_tokens,
            },
        }

    def export_report(self, format: str = "json") -> str:
        """Export cost report in specified format"""
        summary = self.get_cost_summary()

        if format == "json":
            return json.dumps(summary, ensure_ascii=False, indent=2)
        elif format == "csv":
            lines = ["Date,Model,Provider,Tier,Input Tokens,Output Tokens,Total Tokens,Cost,Request Type"]
            for record in self.records:
                lines.append(
                    f"{record.timestamp.isoformat()},"
                    f"{record.model},{record.provider},{record.tier},"
                    f"{record.input_tokens},{record.output_tokens},"
                    f"{record.total_tokens},{record.cost},{record.request_type}"
                )
            return "\n".join(lines)
        else:
            raise ValueError(f"Unsupported format: {format}")

    def cleanup_old_records(self, days_to_keep: int = 90):
        """Remove records older than specified days"""
        cutoff_date = datetime.utcnow() - timedelta(days=days_to_keep)

        old_count = len(self.records)
        self.records = [r for r in self.records if r.timestamp >= cutoff_date]

        # Clean up summaries too
        old_summaries = len(self.daily_summaries)
        self.daily_summaries = {
            date: summary
            for date, summary in self.daily_summaries.items()
            if datetime.fromisoformat(date) >= cutoff_date
        }

        removed = old_count - len(self.records)
        logger.info(f"Cleaned up {removed} old cost records (saved {old_summaries - len(self.daily_summaries)} summaries)")

        self._save_records()


class BudgetManager:
    """Manage budget limits and enforcement"""

    def __init__(self, cost_tracker: CostTracker):
        self.cost_tracker = cost_tracker
        self.hard_limit = settings.DAILY_BUDGET
        self.soft_limit = settings.DAILY_BUDGET * 0.9  # 90% of hard limit
        self.warned = False

    def check_budget(self, estimated_cost: float) -> tuple[bool, str]:
        """
        Check if request is within budget

        Returns:
            (allowed, message)
        """
        today = datetime.utcnow().strftime('%Y-%m-%d')
        today_summary = self.cost_tracker.daily_summaries.get(today)

        current_spend = today_summary.total_cost if today_summary else 0
        projected_spend = current_spend + estimated_cost

        # Hard limit check
        if projected_spend > self.hard_limit:
            return False, f"Budget exceeded: ${projected_spend:.2f} > ${self.hard_limit:.2f}"

        # Soft limit warning
        if projected_spend > self.soft_limit and not self.warned:
            self.warned = True
            return True, f"Warning: Approaching budget limit (${projected_spend:.2f} / ${self.hard_limit:.2f})"

        # Reset warning on new day
        if current_spend < self.soft_limit:
            self.warned = False

        return True, "OK"

    def get_remaining_budget(self) -> Dict:
        """Get remaining budget information"""
        today = datetime.utcnow().strftime('%Y-%m-%d')
        today_summary = self.cost_tracker.daily_summaries.get(today)

        current_spend = today_summary.total_cost if today_summary else 0

        return {
            "daily_limit": self.hard_limit,
            "current_spend": current_spend,
            "remaining": max(0, self.hard_limit - current_spend),
            "percentage_used": (current_spend / self.hard_limit) * 100,
        }
