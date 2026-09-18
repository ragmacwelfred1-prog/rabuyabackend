// resources/js/pages/ParkingCalendar.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
    Card,
    Row,
    Col,
    Table,
    Tag,
    Space,
    Spin,
    message,
    Badge,
    Tooltip,
    Button,
    Select,
    Typography,
    Empty,
    Alert,
    Statistic,
    Divider,
} from 'antd';
import {
    CalendarOutlined,
    CarOutlined,
    ReloadOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    ExclamationCircleOutlined,
    InboxOutlined,
    LeftOutlined,
    RightOutlined,
    InfoCircleOutlined,
    UserOutlined,
    EnvironmentOutlined,
    CheckOutlined,
    CloseOutlined,
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import isToday from 'dayjs/plugin/isToday';
import isBetween from 'dayjs/plugin/isBetween';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import api from '../services/api';

// ─── Extend dayjs ────────────────────────────────────────────────────────────
dayjs.extend(isToday);
dayjs.extend(isBetween);
dayjs.extend(weekOfYear);

const { Text, Title } = Typography;
const { Option } = Select;

// ─── Types ────────────────────────────────────────────────────────────────────

interface Slot {
    id: number;
    slot_number: string;
    status: 'available' | 'occupied' | 'maintenance';
    nightly_rate: number;
}

interface DayInfo {
    date: string;
    day: string;
    dayOfMonth: string;
    isToday: boolean;
    isWeekend: boolean;
}

interface CalendarStatus {
    status: 'available' | 'booked' | 'occupied' | 'maintenance';
    customer_name: string | null;
    booking_id: number | null;
    source: string;
}

interface CalendarData {
    success: boolean;
    month: number;
    year: number;
    month_name: string;
    days: DayInfo[];
    slots: Slot[];
    calendar: Record<string, Record<number, CalendarStatus>>;
    summary: {
        total_slots: number;
        available_today: number;
        booked_today: number;
        occupied_today: number;
        maintenance_today: number;
    };
}

// ─── Status Config ────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
    available: {
        label: 'Available',
        color: 'success',
        bg: 'var(--success-bg)',
        border: 'var(--success-border)',
        text: 'var(--success-text)',
        icon: <CheckCircleOutlined />,
        emoji: '✅',
        description: 'Ready for booking',
    },
    booked: {
        label: 'Booked',
        color: 'processing',
        bg: 'var(--info-bg)',
        border: 'var(--info-border)',
        text: 'var(--info-text)',
        icon: <ClockCircleOutlined />,
        emoji: '📋',
        description: 'Reserved by customer',
    },
    occupied: {
        label: 'Occupied',
        color: 'warning',
        bg: 'var(--warning-bg)',
        border: 'var(--warning-border)',
        text: 'var(--warning-text)',
        icon: <CarOutlined />,
        emoji: '🚗',
        description: 'Currently parked',
    },
    maintenance: {
        label: 'Maintenance',
        color: 'error',
        bg: 'var(--danger-bg)',
        border: 'var(--danger-border)',
        text: 'var(--danger-text)',
        icon: <ExclamationCircleOutlined />,
        emoji: '🔧',
        description: 'Temporarily unavailable',
    },
};

// ─── Helper Functions ─────────────────────────────────────────────────────────

const getStatusConfig = (status: string) => {
    return (
        STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ||
        STATUS_CONFIG.available
    );
};

const isTodayDate = (date: string) => {
    return dayjs(date).isToday();
};

const isWeekendDate = (date: string) => {
    const day = dayjs(date).day();
    return day === 0 || day === 6;
};

const formatDate = (date: string) => dayjs(date).format('MMMM D, YYYY');
const formatDayName = (date: string) => dayjs(date).format('dddd');

// ─── Component ────────────────────────────────────────────────────────────────

const ParkingCalendar: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
    const [selectedMonth, setSelectedMonth] = useState(dayjs().month() + 1);
    const [selectedYear, setSelectedYear] = useState(dayjs().year());
    const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    // ─── Fetch Data ──────────────────────────────────────────────────────────

    const fetchCalendar = async () => {
        setLoading(true);
        try {
            const response = await api.get('/admin/parking-calendar', {
                params: { month: selectedMonth, year: selectedYear },
            });

            console.log('Calendar response:', response.data);
            if (response.data.success) {
                setCalendarData(response.data);
                // Auto-select first slot
                if (response.data.slots.length > 0 && !selectedSlotId) {
                    setSelectedSlotId(response.data.slots[0].id);
                }
                // Auto-select today
                if (!selectedDate) {
                    setSelectedDate(dayjs().format('YYYY-MM-DD'));
                }
            } else {
                message.error('Failed to load calendar data');
            }
        } catch (error) {
            console.error('Calendar error:', error);
            message.error('Failed to load parking calendar');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCalendar();
    }, [selectedMonth, selectedYear]);

    // ─── Handlers ────────────────────────────────────────────────────────────

    const handleMonthChange = (offset: number) => {
        const newMonth = selectedMonth + offset;
        if (newMonth > 12) {
            setSelectedMonth(1);
            setSelectedYear(selectedYear + 1);
        } else if (newMonth < 1) {
            setSelectedMonth(12);
            setSelectedYear(selectedYear - 1);
        } else {
            setSelectedMonth(newMonth);
        }
    };

    const goToToday = () => {
        setSelectedMonth(dayjs().month() + 1);
        setSelectedYear(dayjs().year());
        setSelectedDate(dayjs().format('YYYY-MM-DD'));
    };

    const getSlotStatus = (
        slotId: number,
        date: string,
    ): CalendarStatus | null => {
        if (!calendarData) return null;
        if (!calendarData.calendar[date]) return null;
        return calendarData.calendar[date][slotId] || null;
    };

    // ─── Selected Slot Details ──────────────────────────────────────────────

    const selectedSlot = useMemo(() => {
        if (!calendarData || !selectedSlotId) return null;
        return calendarData.slots.find((s) => s.id === selectedSlotId) || null;
    }, [calendarData, selectedSlotId]);

    const selectedDayStatus = useMemo(() => {
        if (!selectedSlot || !selectedDate || !calendarData) return null;
        return getSlotStatus(selectedSlot.id, selectedDate);
    }, [selectedSlot, selectedDate, calendarData]);

    // ─── Render ─────────────────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="page-loading">
                <Spin size="large" tip="Loading parking calendar..." />
            </div>
        );
    }

    if (!calendarData) {
        return (
            <div style={{ padding: 40, textAlign: 'center' }}>
                <Empty description="No calendar data available" />
            </div>
        );
    }

    const { slots, days, summary, month_name } = calendarData;
    const today = dayjs().format('YYYY-MM-DD');

    // ─── Table Columns ──────────────────────────────────────────────────────

    const columns = [
        {
            title: 'Slot',
            dataIndex: 'slot_number',
            key: 'slot_number',
            fixed: 'left' as const,
            width: 100,
            render: (text: string, record: Slot) => (
                <Space>
                    <EnvironmentOutlined style={{ color: 'var(--primary)' }} />
                    <Text strong style={{ color: 'var(--text-primary)' }}>
                        {text}
                    </Text>
                </Space>
            ),
            sorter: (a: Slot, b: Slot) => {
                const numA = parseInt(a.slot_number.replace(/\D/g, ''));
                const numB = parseInt(b.slot_number.replace(/\D/g, ''));
                return numA - numB;
            },
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 110,
            render: (status: string, record: Slot) => {
                const config = getStatusConfig(
                    status === 'maintenance' ? 'maintenance' : 'available',
                );
                return (
                    <Tag color={config.color} icon={config.icon}>
                        {config.emoji} {config.label}
                    </Tag>
                );
            },
        },
        {
            title: 'Rate',
            dataIndex: 'nightly_rate',
            key: 'rate',
            width: 80,
            align: 'right' as const,
            render: (rate: number) => (
                <span style={{ fontWeight: 600, color: 'var(--success)' }}>
                    ₱{rate}
                </span>
            ),
        },
        ...days.map((day) => ({
            title: (
                <Tooltip title={formatDate(day.date)}>
                    <div
                        style={{
                            textAlign: 'center',
                            fontWeight: day.isToday ? 700 : 400,
                            color: day.isToday
                                ? 'var(--primary)'
                                : day.isWeekend
                                  ? 'var(--text-tertiary)'
                                  : 'var(--text-secondary)',
                            fontSize: day.isToday ? 14 : 12,
                            padding: '2px 0',
                        }}
                    >
                        <div>{day.dayOfMonth}</div>
                        <div
                            style={{
                                fontSize: 8,
                                color: day.isToday
                                    ? 'var(--primary)'
                                    : 'var(--text-tertiary)',
                                fontWeight: day.isToday ? 700 : 400,
                                textTransform: 'uppercase',
                                marginTop: -2,
                            }}
                        >
                            {day.day}
                        </div>
                        {day.isToday && (
                            <div
                                style={{
                                    height: 3,
                                    width: 20,
                                    background: 'var(--primary)',
                                    borderRadius: 2,
                                    margin: '1px auto 0',
                                }}
                            />
                        )}
                    </div>
                </Tooltip>
            ),
            dataIndex: ['calendar', day.date],
            key: day.date,
            width: 48,
            align: 'center' as const,
            render: (_: any, record: Slot) => {
                const status = getSlotStatus(record.id, day.date);
                if (!status) {
                    return (
                        <span
                            style={{
                                color: 'var(--text-tertiary)',
                                fontSize: 10,
                            }}
                        >
                            —
                        </span>
                    );
                }

                const config = getStatusConfig(status.status);
                const isSelected =
                    selectedSlotId === record.id && selectedDate === day.date;

                // If slot is maintenance, show maintenance indicator
                if (record.status === 'maintenance') {
                    return (
                        <Tooltip
                            title={`${record.slot_number}: Under Maintenance`}
                        >
                            <div
                                style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 6,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto',
                                    background: 'var(--danger-bg)',
                                    border: `1px solid var(--danger-border)`,
                                    opacity: 0.6,
                                    cursor: 'default',
                                }}
                            >
                                <ExclamationCircleOutlined
                                    style={{
                                        color: 'var(--danger)',
                                        fontSize: 12,
                                    }}
                                />
                            </div>
                        </Tooltip>
                    );
                }

                const isAvailable = status.status === 'available';
                const isBooked = status.status === 'booked';
                const isOccupied = status.status === 'occupied';

                return (
                    <Tooltip
                        title={
                            <div>
                                <div>
                                    <strong>{record.slot_number}</strong>
                                </div>
                                <div>
                                    {config.emoji} {config.label}
                                </div>
                                {status.customer_name && (
                                    <div>👤 {status.customer_name}</div>
                                )}
                                {!isAvailable && !isOccupied && (
                                    <div
                                        style={{
                                            fontSize: 11,
                                            color: '#94A3B8',
                                        }}
                                    >
                                        Click for details
                                    </div>
                                )}
                            </div>
                        }
                    >
                        <div
                            onClick={() => {
                                if (record.status !== 'maintenance') {
                                    setSelectedSlotId(record.id);
                                    setSelectedDate(day.date);
                                }
                            }}
                            style={{
                                width: 34,
                                height: 34,
                                borderRadius: 6,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto',
                                cursor:
                                    record.status === 'maintenance'
                                        ? 'default'
                                        : 'pointer',
                                background: isSelected
                                    ? 'var(--primary)'
                                    : config.bg,
                                border: isSelected
                                    ? `2px solid var(--primary)`
                                    : `1px solid ${isAvailable ? 'var(--success-border)' : config.border}`,
                                transition: 'all 0.15s ease',
                                transform: isSelected
                                    ? 'scale(1.05)'
                                    : 'scale(1)',
                                boxShadow: isSelected
                                    ? '0 2px 8px rgba(16, 185, 129, 0.3)'
                                    : 'none',
                            }}
                            onMouseEnter={(e) => {
                                if (
                                    !isSelected &&
                                    record.status !== 'maintenance'
                                ) {
                                    e.currentTarget.style.transform =
                                        'scale(1.08)';
                                    e.currentTarget.style.boxShadow =
                                        '0 2px 8px var(--shadow-color)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isSelected) {
                                    e.currentTarget.style.transform =
                                        'scale(1)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }
                            }}
                        >
                            <span
                                style={{
                                    color: isSelected ? '#fff' : config.text,
                                    fontWeight: isSelected ? 700 : 500,
                                    fontSize: isSelected ? 16 : 14,
                                }}
                            >
                                {isAvailable
                                    ? '✓'
                                    : isOccupied
                                      ? '🚗'
                                      : isBooked
                                        ? '📋'
                                        : '—'}
                            </span>
                        </div>
                    </Tooltip>
                );
            },
        })),
    ];

    // ─── Render ─────────────────────────────────────────────────────────────

    return (
        <div style={{ paddingBottom: 24 }}>
            {/* ─── HEADER ─────────────────────────────────────────────────────── */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">
                        <CalendarOutlined
                            style={{ color: 'var(--primary)', marginRight: 10 }}
                        />
                        Parking Calendar
                    </h1>
                    <p className="page-description">
                        View daily occupancy for all parking slots. Click any
                        cell for details.
                    </p>
                </div>
                <Space>
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={fetchCalendar}
                        loading={loading}
                    >
                        Refresh
                    </Button>
                    <Button type="primary" onClick={goToToday}>
                        <CalendarOutlined /> Today
                    </Button>
                </Space>
            </div>

            {/* ─── SUMMARY STATS ────────────────────────────────────────────── */}
            <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
                <Col xs={12} sm={6}>
                    <Card
                        size="small"
                        style={{ borderRadius: 10, height: '100%' }}
                        styles={{ body: { padding: '12px 16px' } }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}
                        >
                            <div>
                                <div
                                    style={{
                                        fontSize: 11,
                                        color: 'var(--text-tertiary)',
                                        textTransform: 'uppercase',
                                        fontWeight: 600,
                                    }}
                                >
                                    Total Slots
                                </div>
                                <div
                                    style={{
                                        fontSize: 20,
                                        fontWeight: 700,
                                        color: 'var(--text-primary)',
                                    }}
                                >
                                    {summary.total_slots}
                                </div>
                            </div>
                            <InboxOutlined
                                style={{
                                    color: 'var(--primary)',
                                    fontSize: 20,
                                }}
                            />
                        </div>
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card
                        size="small"
                        style={{ borderRadius: 10, height: '100%' }}
                        styles={{ body: { padding: '12px 16px' } }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}
                        >
                            <div>
                                <div
                                    style={{
                                        fontSize: 11,
                                        color: 'var(--text-tertiary)',
                                        textTransform: 'uppercase',
                                        fontWeight: 600,
                                    }}
                                >
                                    Available Today
                                </div>
                                <div
                                    style={{
                                        fontSize: 20,
                                        fontWeight: 700,
                                        color: 'var(--success)',
                                    }}
                                >
                                    {summary.available_today}
                                </div>
                            </div>
                            <CheckCircleOutlined
                                style={{
                                    color: 'var(--success)',
                                    fontSize: 20,
                                }}
                            />
                        </div>
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card
                        size="small"
                        style={{ borderRadius: 10, height: '100%' }}
                        styles={{ body: { padding: '12px 16px' } }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}
                        >
                            <div>
                                <div
                                    style={{
                                        fontSize: 11,
                                        color: 'var(--text-tertiary)',
                                        textTransform: 'uppercase',
                                        fontWeight: 600,
                                    }}
                                >
                                    Booked / Occupied
                                </div>
                                <div
                                    style={{
                                        fontSize: 20,
                                        fontWeight: 700,
                                        color: 'var(--warning)',
                                    }}
                                >
                                    {summary.booked_today +
                                        summary.occupied_today}
                                </div>
                            </div>
                            <CarOutlined
                                style={{
                                    color: 'var(--warning)',
                                    fontSize: 20,
                                }}
                            />
                        </div>
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card
                        size="small"
                        style={{ borderRadius: 10, height: '100%' }}
                        styles={{ body: { padding: '12px 16px' } }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}
                        >
                            <div>
                                <div
                                    style={{
                                        fontSize: 11,
                                        color: 'var(--text-tertiary)',
                                        textTransform: 'uppercase',
                                        fontWeight: 600,
                                    }}
                                >
                                    Maintenance
                                </div>
                                <div
                                    style={{
                                        fontSize: 20,
                                        fontWeight: 700,
                                        color: 'var(--danger)',
                                    }}
                                >
                                    {summary.maintenance_today}
                                </div>
                            </div>
                            <ExclamationCircleOutlined
                                style={{ color: 'var(--danger)', fontSize: 20 }}
                            />
                        </div>
                    </Card>
                </Col>
            </Row>

            {/* ─── LEGEND ────────────────────────────────────────────────────── */}
            <Card
                size="small"
                style={{ marginBottom: 16, borderRadius: 10 }}
                styles={{ body: { padding: '10px 16px' } }}
            >
                <div
                    style={{
                        display: 'flex',
                        gap: 20,
                        flexWrap: 'wrap',
                        alignItems: 'center',
                    }}
                >
                    <Text
                        strong
                        style={{ color: 'var(--text-secondary)', fontSize: 12 }}
                    >
                        📌 Legend:
                    </Text>
                    {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                        <div
                            key={key}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                            }}
                        >
                            <div
                                style={{
                                    width: 18,
                                    height: 18,
                                    borderRadius: 4,
                                    background: config.bg,
                                    border: `1px solid ${config.border}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 10,
                                }}
                            >
                                {config.emoji}
                            </div>
                            <span
                                style={{
                                    fontSize: 12,
                                    color: 'var(--text-secondary)',
                                }}
                            >
                                {config.label}
                            </span>
                        </div>
                    ))}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            marginLeft: 8,
                        }}
                    >
                        <div
                            style={{
                                width: 18,
                                height: 18,
                                borderRadius: 4,
                                background: 'var(--primary)',
                                border: '2px solid var(--primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 10,
                                color: '#fff',
                                fontWeight: 700,
                            }}
                        >
                            ✓
                        </div>
                        <span
                            style={{
                                fontSize: 12,
                                color: 'var(--text-secondary)',
                            }}
                        >
                            <strong style={{ color: 'var(--primary)' }}>
                                Selected
                            </strong>{' '}
                            (click any cell)
                        </span>
                    </div>
                </div>
            </Card>

            {/* ─── MONTH NAVIGATION ────────────────────────────────────────── */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 12,
                    flexWrap: 'wrap',
                    gap: 8,
                }}
            >
                <Space>
                    <Button
                        icon={<LeftOutlined />}
                        onClick={() => handleMonthChange(-1)}
                    />
                    <Text
                        strong
                        style={{
                            fontSize: 18,
                            color: 'var(--text-primary)',
                            minWidth: 160,
                            textAlign: 'center',
                        }}
                    >
                        {month_name}
                    </Text>
                    <Button
                        icon={<RightOutlined />}
                        onClick={() => handleMonthChange(1)}
                    />
                </Space>
                <Space>
                    <Select
                        value={selectedMonth}
                        onChange={(val) => setSelectedMonth(val)}
                        style={{ width: 100 }}
                        size="small"
                    >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(
                            (m) => (
                                <Option key={m} value={m}>
                                    {dayjs()
                                        .month(m - 1)
                                        .format('MMM')}
                                </Option>
                            ),
                        )}
                    </Select>
                    <Select
                        value={selectedYear}
                        onChange={(val) => setSelectedYear(val)}
                        style={{ width: 85 }}
                        size="small"
                    >
                        {Array.from(
                            { length: 5 },
                            (_, i) => dayjs().year() - 2 + i,
                        ).map((y) => (
                            <Option key={y} value={y}>
                                {y}
                            </Option>
                        ))}
                    </Select>
                </Space>
            </div>

            {/* ─── MAIN CALENDAR TABLE ──────────────────────────────────────── */}
            <Card
                style={{ borderRadius: 12, overflow: 'hidden' }}
                styles={{ body: { padding: 0 } }}
            >
                <Table
                    dataSource={slots}
                    columns={columns}
                    rowKey="id"
                    pagination={false}
                    size="small"
                    scroll={{ x: 'max-content', y: 480 }}
                    bordered
                    rowClassName={(record) =>
                        selectedSlotId === record.id
                            ? 'ant-table-row-selected'
                            : ''
                    }
                    onRow={(record) => ({
                        onClick: () => {
                            if (selectedSlotId !== record.id) {
                                setSelectedSlotId(record.id);
                            }
                        },
                    })}
                    summary={() => {
                        // Calculate available slots per day
                        const availablePerDay = days.map((day) => {
                            let count = 0;
                            slots.forEach((slot) => {
                                const status = getSlotStatus(slot.id, day.date);
                                if (
                                    status &&
                                    status.status === 'available' &&
                                    slot.status !== 'maintenance'
                                ) {
                                    count++;
                                }
                            });
                            return { date: day.date, count };
                        });

                        return (
                            <Table.Summary fixed>
                                <Table.Summary.Row
                                    style={{
                                        background: 'var(--bg-surface-hover)',
                                        fontWeight: 600,
                                    }}
                                >
                                    <Table.Summary.Cell index={0} colSpan={3}>
                                        <span
                                            style={{
                                                color: 'var(--text-secondary)',
                                            }}
                                        >
                                            📊 Available Slots
                                        </span>
                                    </Table.Summary.Cell>
                                    {availablePerDay.map((day) => (
                                        <Table.Summary.Cell
                                            key={day.date}
                                            align="center"
                                        >
                                            <Tooltip
                                                title={`${day.count} available slots`}
                                            >
                                                <span
                                                    style={{
                                                        color:
                                                            day.count > 0
                                                                ? 'var(--success)'
                                                                : 'var(--text-tertiary)',
                                                        fontSize: 12,
                                                    }}
                                                >
                                                    {day.count > 0
                                                        ? `🟢 ${day.count}`
                                                        : '—'}
                                                </span>
                                            </Tooltip>
                                        </Table.Summary.Cell>
                                    ))}
                                </Table.Summary.Row>
                            </Table.Summary>
                        );
                    }}
                />
            </Card>

            {/* ─── SELECTED DAY DETAILS ────────────────────────────────────── */}
            {selectedSlot && selectedDate && selectedDayStatus && (
                <Card style={{ marginTop: 16, borderRadius: 12 }}>
                    <Row gutter={[16, 16]} align="middle">
                        <Col xs={24} sm={4}>
                            <div>
                                <div
                                    style={{
                                        fontSize: 11,
                                        color: 'var(--text-tertiary)',
                                        textTransform: 'uppercase',
                                        fontWeight: 600,
                                    }}
                                >
                                    Slot
                                </div>
                                <div
                                    style={{
                                        fontSize: 22,
                                        fontWeight: 700,
                                        color: 'var(--text-primary)',
                                    }}
                                >
                                    {selectedSlot.slot_number}
                                </div>
                                <div
                                    style={{
                                        fontSize: 12,
                                        color: 'var(--text-secondary)',
                                    }}
                                >
                                    ₱{selectedSlot.nightly_rate}/night
                                </div>
                            </div>
                        </Col>
                        <Col xs={24} sm={4}>
                            <div>
                                <div
                                    style={{
                                        fontSize: 11,
                                        color: 'var(--text-tertiary)',
                                        textTransform: 'uppercase',
                                        fontWeight: 600,
                                    }}
                                >
                                    Date
                                </div>
                                <div
                                    style={{
                                        fontSize: 16,
                                        fontWeight: 600,
                                        color: 'var(--text-primary)',
                                    }}
                                >
                                    {formatDate(selectedDate)}
                                </div>
                                <div
                                    style={{
                                        fontSize: 12,
                                        color: 'var(--text-secondary)',
                                    }}
                                >
                                    {formatDayName(selectedDate)}
                                    {isTodayDate(selectedDate) && ' 📍 Today'}
                                </div>
                            </div>
                        </Col>
                        <Col xs={24} sm={4}>
                            <div>
                                <div
                                    style={{
                                        fontSize: 11,
                                        color: 'var(--text-tertiary)',
                                        textTransform: 'uppercase',
                                        fontWeight: 600,
                                    }}
                                >
                                    Status
                                </div>
                                <Tag
                                    color={
                                        getStatusConfig(
                                            selectedDayStatus.status,
                                        ).color
                                    }
                                    icon={
                                        getStatusConfig(
                                            selectedDayStatus.status,
                                        ).icon
                                    }
                                    style={{
                                        fontSize: 14,
                                        padding: '4px 14px',
                                        margin: 0,
                                    }}
                                >
                                    {
                                        getStatusConfig(
                                            selectedDayStatus.status,
                                        ).emoji
                                    }{' '}
                                    {
                                        getStatusConfig(
                                            selectedDayStatus.status,
                                        ).label
                                    }
                                </Tag>
                            </div>
                        </Col>
                        <Col xs={24} sm={6}>
                            {selectedDayStatus.customer_name && (
                                <div>
                                    <div
                                        style={{
                                            fontSize: 11,
                                            color: 'var(--text-tertiary)',
                                            textTransform: 'uppercase',
                                            fontWeight: 600,
                                        }}
                                    >
                                        Customer
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 15,
                                            fontWeight: 500,
                                            color: 'var(--text-primary)',
                                        }}
                                    >
                                        <UserOutlined
                                            style={{ marginRight: 6 }}
                                        />
                                        {selectedDayStatus.customer_name}
                                    </div>
                                </div>
                            )}
                        </Col>
                        <Col xs={24} sm={6} style={{ textAlign: 'right' }}>
                            {selectedDayStatus.status === 'available' ? (
                                <Button
                                    type="primary"
                                    icon={<CheckOutlined />}
                                    size="large"
                                >
                                    Available - Book Now
                                </Button>
                            ) : selectedDayStatus.status === 'maintenance' ? (
                                <Button
                                    disabled
                                    icon={<ExclamationCircleOutlined />}
                                    size="large"
                                >
                                    Under Maintenance
                                </Button>
                            ) : (
                                <Button
                                    disabled
                                    icon={<CarOutlined />}
                                    size="large"
                                >
                                    {selectedDayStatus.status === 'occupied'
                                        ? 'Currently Occupied'
                                        : 'Already Booked'}
                                </Button>
                            )}
                        </Col>
                    </Row>
                </Card>
            )}

            {/* ─── TIPS ──────────────────────────────────────────────────────── */}
            <Card
                size="small"
                style={{
                    marginTop: 16,
                    borderRadius: 10,
                    background: 'var(--info-bg)',
                    borderColor: 'var(--info-border)',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        flexWrap: 'wrap',
                    }}
                >
                    <InfoCircleOutlined style={{ color: 'var(--info-text)' }} />
                    <span style={{ color: 'var(--info-text)', fontSize: 13 }}>
                        <strong>💡 Tip:</strong> Click any colored cell to see
                        details. Green = Available, Blue = Booked, Yellow =
                        Occupied, Red = Maintenance. The{' '}
                        <strong>summary row</strong> shows available slots per
                        day.
                    </span>
                </div>
            </Card>

            <style>{`
                .ant-table-row-selected td {
                    background: var(--primary-bg) !important;
                }

                .ant-table-row-selected td:first-child {
                    border-left: 3px solid var(--primary) !important;
                }

                [data-theme="dark"] .ant-table-row-selected td {
                    background: rgba(16, 185, 129, 0.15) !important;
                }

                [data-theme="dark"] .ant-table-summary td {
                    background: var(--bg-surface-hover) !important;
                }
            `}</style>
        </div>
    );
};

export default ParkingCalendar;
