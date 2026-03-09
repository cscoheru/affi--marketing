-- 定时选品任务表
CREATE TABLE IF NOT EXISTS schedule_tasks (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    frequency VARCHAR(20) NOT NULL,  -- daily/weekly/monthly
    execute_time VARCHAR(10) NOT NULL,  -- HH:MM format
    category VARCHAR(50),
    min_price INTEGER DEFAULT 0,
    max_price INTEGER DEFAULT 500,
    min_rating VARCHAR(10),
    auto_add BOOLEAN DEFAULT FALSE,
    max_results INTEGER DEFAULT 10,
    competition_level VARCHAR(20),
    market_trend VARCHAR(20),
    status VARCHAR(20) DEFAULT 'active',  -- active/paused/deleted
    last_run_at TIMESTAMP,
    next_run_at TIMESTAMP,
    run_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 定时任务执行历史表
CREATE TABLE IF NOT EXISTS schedule_task_history (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES schedule_tasks(id),
    run_at TIMESTAMP NOT NULL,
    status VARCHAR(20),  -- success/failed/partial
    products_found INTEGER DEFAULT 0,
    products_added INTEGER DEFAULT 0,
    top_products JSONB DEFAULT '[]',
    error_message TEXT,
    execution_time INTEGER DEFAULT 0,  -- 执行时间(毫秒)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_schedule_tasks_status ON schedule_tasks(status);
CREATE INDEX IF NOT EXISTS idx_schedule_tasks_next_run ON schedule_tasks(next_run_at);
CREATE INDEX IF NOT EXISTS idx_schedule_history_task_id ON schedule_task_history(task_id);
CREATE INDEX IF NOT EXISTS idx_schedule_history_run_at ON schedule_task_history(run_at);

-- 注释
COMMENT ON TABLE schedule_tasks IS '定时选品任务配置';
COMMENT ON TABLE schedule_task_history IS '定时任务执行历史记录';
