// resources/js/pages/FuelProducts.tsx
import React, { useState, useEffect } from 'react';
import {
    Table,
    Button,
    Modal,
    Form,
    Input,
    message,
    Tag,
    Space,
    Card,
    Row,
    Col,
    Tabs,
    Tooltip,
    InputNumber,
    Alert,
    Badge,
    Spin,
    DatePicker,
    Select,
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    FireOutlined,
    DollarOutlined,
    DownloadOutlined,
    ShopOutlined,
    WarningOutlined,
    InboxOutlined,
    BellOutlined,
    SettingOutlined,
    CalendarOutlined,
    CheckOutlined,
    CloseOutlined,
    EyeOutlined,
    ReloadOutlined,
} from '@ant-design/icons';
import api from '../services/api';
import dayjs from 'dayjs';

// ─── Interfaces ─────────────────────────────────────────────────────────────

interface FuelProduct {
    id: number;
    type: string;
    current_selling_price?: number;
}

interface FuelInventory {
    id: number;
    fuel_product_id: number;
    liters_delivered: number;
    remaining_liters: number;
    cost_price_per_liter: number;
    selling_price_per_liter: number;
    delivery_date: string;
    reference_no?: string;
    created_at?: string;
    supplier?: { id: number; supplier_name: string };
    fuel_product?: FuelProduct;
}

interface FuelSale {
    id: number;
    transaction_number: string;
    fuel_product_id: number;
    liters: number;
    price_per_liter: number;
    total_amount: number;
    amount_paid: number;
    change_amount: number;
    payment_method: string;
    created_at: string;
    fuel_product?: FuelProduct;
    recorded_by?: { first_name: string; last_name: string };
}

interface Remittance {
    id: number;
    staff_id: number;
    staff: {
        id: number;
        first_name: string;
        last_name: string;
        email: string;
    };
    remittance_date: string;
    remitted_amount: number;
    actual_sales_amount: number;
    status: 'pending' | 'approved' | 'rejected';
    reviewed_at: string | null;
    created_at: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

const FuelProducts: React.FC = () => {
    const [products, setProducts] = useState<FuelProduct[]>([]);
    const [inventory, setInventory] = useState<FuelInventory[]>([]);
    const [sales, setSales] = useState<FuelSale[]>([]);
    const [todaySales, setTodaySales] = useState<FuelSale[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingProduct, setEditingProduct] = useState<FuelProduct | null>(
        null,
    );
    const [form] = Form.useForm();
    const [lowStockThreshold, setLowStockThreshold] = useState<number>(500);
    const [thresholdModalVisible, setThresholdModalVisible] = useState(false);
    const [thresholdForm] = Form.useForm();

    const [remittances, setRemittances] = useState<Remittance[]>([]);
    const [remLoading, setRemLoading] = useState(false);
    const [remFilters, setRemFilters] = useState({
        status: '',
        date_from: '',
        date_to: '',
    });
    const [remModalVisible, setRemModalVisible] = useState(false);
    const [selectedRemittance, setSelectedRemittance] =
        useState<Remittance | null>(null);
    const [approvingId, setApprovingId] = useState<number | null>(null);

    useEffect(() => {
        fetchAllData();
        const saved = localStorage.getItem('lowStockThreshold');
        if (saved) setLowStockThreshold(Number(saved));
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                fetchProducts(),
                fetchInventory(),
                fetchSales(),
                fetchTodaySales(),
                fetchRemittances(),
            ]);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            const r = await api.get('/fuel-products');
            setProducts(Array.isArray(r.data) ? r.data : []);
        } catch {
            setProducts([]);
        }
    };

    const fetchInventory = async () => {
        try {
            const r = await api.get('/fuel/inventory');
            setInventory(Array.isArray(r.data) ? r.data : []);
        } catch {
            setInventory([]);
        }
    };

    const fetchSales = async () => {
        try {
            const r = await api.get('/fuel/sales');
            setSales(Array.isArray(r.data) ? r.data : []);
        } catch {
            setSales([]);
        }
    };

    const fetchTodaySales = async () => {
        try {
            const r = await api.get('/fuel/sales/today');
            const data = Array.isArray(r.data)
                ? r.data
                : Array.isArray(r.data?.sales)
                  ? r.data.sales
                  : [];
            setTodaySales(data);
        } catch {
            setTodaySales([]);
        }
    };

    const fetchRemittances = async () => {
        setRemLoading(true);
        try {
            const params = new URLSearchParams();
            if (remFilters.status) params.append('status', remFilters.status);
            if (remFilters.date_from)
                params.append('date_from', remFilters.date_from);
            if (remFilters.date_to)
                params.append('date_to', remFilters.date_to);
            const res = await api.get(
                `/admin/remittances?${params.toString()}`,
            );
            setRemittances(Array.isArray(res.data) ? res.data : []);
        } catch {
            setRemittances([]);
        } finally {
            setRemLoading(false);
        }
    };

    useEffect(() => {
        fetchRemittances();
    }, [remFilters]);

    const handleAdd = () => {
        setEditingProduct(null);
        form.resetFields();
        setModalVisible(true);
    };

    const handleEdit = (record: FuelProduct) => {
        setEditingProduct(record);
        const currentPrice = getActivePrice(record.id);
        form.setFieldsValue({
            type: record.type,
            selling_price: currentPrice,
        });
        setModalVisible(true);
    };

    const handleSubmit = async (values: any) => {
        try {
            if (editingProduct) {
                const data: any = {
                    type: values.type,
                    current_selling_price: values.selling_price,
                };
                const response = await api.put(
                    `/fuel-products/${editingProduct.id}`,
                    data,
                );
                setProducts((prev) =>
                    prev.map((p) =>
                        p.id === editingProduct.id
                            ? { ...p, ...response.data }
                            : p,
                    ),
                );
                message.success('Product updated!');
                await fetchInventory();
            } else {
                const response = await api.post('/fuel-products', {
                    type: values.type,
                    current_selling_price: values.selling_price ?? 0,
                });
                setProducts((prev) => [...prev, response.data]);
                message.success('Product added!');
            }
            setModalVisible(false);
            form.resetFields();
            fetchAllData();
        } catch (e: any) {
            message.error(e.response?.data?.message || 'Error');
        }
    };

    const handleSaveThreshold = (values: any) => {
        const val = Number(values.threshold);
        setLowStockThreshold(val);
        localStorage.setItem('lowStockThreshold', String(val));
        setThresholdModalVisible(false);
        message.success(`Threshold set to ${val} L`);
    };

    const handleReview = async (
        id: number,
        status: 'approved' | 'rejected',
    ) => {
        setApprovingId(id);
        try {
            await api.patch(`/admin/remittances/${id}`, { status });
            message.success(`Remittance ${status}.`);
            await fetchRemittances();
            setRemModalVisible(false);
        } catch (error: any) {
            message.error(
                error.response?.data?.message || 'Failed to update status',
            );
        } finally {
            setApprovingId(null);
        }
    };

    const handleViewRemittance = (record: Remittance) => {
        setSelectedRemittance(record);
        setRemModalVisible(true);
    };

    // ─── Helpers ──────────────────────────────────────────────────────────────

    const formatNumber = (num: number): string => {
        if (isNaN(num) || num === null || num === undefined) return '0';
        if (num % 1 === 0) return num.toLocaleString();
        return num.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        });
    };

    const formatCurrency = (amount: number): string => {
        if (isNaN(amount) || amount === null || amount === undefined)
            return '₱0.00';
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 2,
        }).format(amount);
    };

    const getCurrentStock = (pid: number) => {
        return inventory
            .filter((i) => i.fuel_product_id === pid)
            .reduce((s, i) => s + Number(i.remaining_liters || 0), 0);
    };

    const getTotalSold = (pid: number) => {
        return sales
            .filter((s) => s.fuel_product_id === pid)
            .reduce((s, sa) => s + Number(sa.liters || 0), 0);
    };

    const getTotalRevenue = (pid: number) => {
        return sales
            .filter((s) => s.fuel_product_id === pid)
            .reduce((s, sa) => s + Number(sa.total_amount || 0), 0);
    };

    const getActivePrice = (pid: number) => {
        const inv = inventory.filter(
            (i) => i.fuel_product_id === pid && Number(i.remaining_liters) > 0,
        );
        if (inv.length > 0) {
            const sorted = [...inv].sort((a, b) => {
                const dateDiff =
                    new Date(b.delivery_date || '').getTime() -
                    new Date(a.delivery_date || '').getTime();
                return dateDiff !== 0 ? dateDiff : b.id - a.id;
            });
            const price = Number(sorted[0].selling_price_per_liter || 0);
            if (price > 0) return price;
        }
        const product = products.find((p) => p.id === pid);
        return Number(product?.current_selling_price || 0);
    };

    const getTotalCostValue = (pid: number) =>
        inventory
            .filter((i) => i.fuel_product_id === pid)
            .reduce(
                (s, i) =>
                    s +
                    Number(i.liters_delivered || 0) *
                        Number(i.cost_price_per_liter || 0),
                0,
            );

    const getTotalSellingValue = (pid: number) =>
        inventory
            .filter((i) => i.fuel_product_id === pid)
            .reduce(
                (s, i) =>
                    s +
                    Number(i.liters_delivered || 0) *
                        Number(i.selling_price_per_liter || 0),
                0,
            );

    // ─── Stats ─────────────────────────────────────────────────────────────────

    const todayTotalLiters = todaySales.reduce(
        (s, sa) => s + Number(sa.liters || 0),
        0,
    );
    const todayTotalRevenue = todaySales.reduce(
        (s, sa) => s + Number(sa.total_amount || 0),
        0,
    );
    const todayTotalTransactions = todaySales.length;
    const totalProducts = products.length;
    const totalSalesCount = sales.length;
    const totalRevenue = sales.reduce(
        (s, sa) => s + Number(sa.total_amount || 0),
        0,
    );
    const totalLitersSold = sales.reduce(
        (s, sa) => s + Number(sa.liters || 0),
        0,
    );
    const totalStockValue = products.reduce(
        (s, p) => s + getCurrentStock(p.id) * getActivePrice(p.id),
        0,
    );
    const lowStockProducts = products.filter((p) => {
        const st = getCurrentStock(p.id);
        return st > 0 && st <= lowStockThreshold;
    });
    const outOfStockProducts = products.filter(
        (p) => getCurrentStock(p.id) <= 0,
    );

    const grandTotalCostValue = products.reduce(
        (s, p) => s + getTotalCostValue(p.id),
        0,
    );
    const grandTotalSellingValue = products.reduce(
        (s, p) => s + getTotalSellingValue(p.id),
        0,
    );

    // ─── Export functions ──────────────────────────────────────────────────────

    const exportTodayReport = () => {
        if (!todaySales.length) {
            message.warning('No sales data for today');
            return;
        }
        const BOM = '\uFEFF';
        let csv = "Today's Fuel Sales Report\n";
        csv += `Date: ${dayjs().format('MMMM DD, YYYY')}\n`;
        csv += `Transactions: ${todayTotalTransactions}\nLiters: ${formatNumber(todayTotalLiters)} L\nRevenue: ${formatCurrency(todayTotalRevenue)}\n\n`;
        csv +=
            'Time,Transaction #,Product,Liters,Price/L,Total,Paid,Change,Payment,Recorded By\n';
        todaySales.forEach((s) => {
            const recordedBy = s.recorded_by
                ? `${s.recorded_by.first_name} ${s.recorded_by.last_name}`
                : 'N/A';
            csv += `${s.created_at ? dayjs(s.created_at).format('h:mm A') : '-'},`;
            csv += `"${(s.transaction_number || 'N/A').replace(/"/g, '""')}","${s.fuel_product?.type || 'N/A'}",`;
            csv += `${Number(s.liters || 0).toFixed(2)},${Number(s.price_per_liter || 0).toFixed(2)},${Number(s.total_amount || 0).toFixed(2)},`;
            csv += `${Number(s.amount_paid || 0).toFixed(2)},${Number(s.change_amount || 0).toFixed(2)},${s.payment_method || 'cash'},"${recordedBy}"\n`;
        });
        const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `today_fuel_sales_${dayjs().format('YYYY-MM-DD')}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        message.success("Today's report downloaded!");
    };

    const exportSalesReport = () => {
        if (!sales.length) {
            message.warning('No sales data');
            return;
        }
        const BOM = '\uFEFF';
        let csv = 'Fuel Sales Report\n';
        csv += `Generated: ${dayjs().format('MMMM DD, YYYY')}\n`;
        csv += `Records: ${sales.length}\nLiters: ${formatNumber(totalLitersSold)} L\nRevenue: ${formatCurrency(totalRevenue)}\n\n`;
        csv +=
            'Date,Transaction #,Product,Liters,Price/L,Total,Paid,Change,Payment,Recorded By\n';
        sales.forEach((s) => {
            const recordedBy = s.recorded_by
                ? `${s.recorded_by.first_name} ${s.recorded_by.last_name}`
                : 'N/A';
            csv += `${s.created_at ? dayjs(s.created_at).format('YYYY-MM-DD HH:mm') : '-'},`;
            csv += `"${(s.transaction_number || 'N/A').replace(/"/g, '""')}","${products.find((p) => p.id === s.fuel_product_id)?.type || 'N/A'}",`;
            csv += `${Number(s.liters || 0).toFixed(2)},${Number(s.price_per_liter || 0).toFixed(2)},${Number(s.total_amount || 0).toFixed(2)},`;
            csv += `${Number(s.amount_paid || 0).toFixed(2)},${Number(s.change_amount || 0).toFixed(2)},${s.payment_method || 'cash'},"${recordedBy}"\n`;
        });
        const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fuel_sales_report_${dayjs().format('YYYY-MM-DD')}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        message.success('Sales report downloaded!');
    };

    // ─── TABLE COLUMNS ────────────────────────────────────────────────────────

    const todaySalesColumns = [
        {
            title: 'Time',
            dataIndex: 'created_at',
            key: 'time',
            width: 100,
            render: (d: string) => (
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {d ? dayjs(d).format('h:mm A') : '-'}
                </span>
            ),
        },
        {
            title: 'Txn #',
            dataIndex: 'transaction_number',
            key: 'txn',
            width: 120,
            render: (t: string) => (
                <Tag color="green" style={{ fontSize: 10, margin: 0 }}>
                    {t || 'N/A'}
                </Tag>
            ),
        },
        {
            title: 'Product',
            key: 'prod',
            width: 140,
            render: (_: any, r: FuelSale) => (
                <Tag color="blue" style={{ fontSize: 10, margin: 0 }}>
                    {r.fuel_product?.type || 'N/A'}
                </Tag>
            ),
        },
        {
            title: 'Liters',
            dataIndex: 'liters',
            key: 'liters',
            width: 90,
            align: 'right' as const,
            render: (l: any) => (
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {formatNumber(Number(l || 0))} L
                </span>
            ),
        },
        {
            title: 'Price/L',
            dataIndex: 'price_per_liter',
            key: 'ppl',
            width: 90,
            align: 'right' as const,
            render: (p: any) => (
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {formatCurrency(Number(p || 0))}
                </span>
            ),
        },
        {
            title: 'Total',
            dataIndex: 'total_amount',
            key: 'total',
            width: 100,
            align: 'right' as const,
            render: (a: any) => (
                <span
                    style={{
                        fontWeight: 600,
                        color: 'var(--success)',
                        fontSize: 12,
                    }}
                >
                    {formatCurrency(Number(a || 0))}
                </span>
            ),
        },
        {
            title: 'Payment',
            dataIndex: 'amount_paid',
            key: 'paid',
            width: 100,
            align: 'right' as const,
            render: (a: any) => (
                <span
                    style={{
                        fontWeight: 600,
                        color: 'var(--primary)',
                        fontSize: 12,
                    }}
                >
                    {formatCurrency(Number(a || 0))}
                </span>
            ),
        },
        {
            title: 'Change',
            dataIndex: 'change_amount',
            key: 'change',
            width: 90,
            align: 'right' as const,
            render: (c: any) => (
                <span
                    style={{
                        fontSize: 12,
                        color:
                            Number(c || 0) > 0
                                ? 'var(--success)'
                                : 'var(--text-tertiary)',
                    }}
                >
                    {formatCurrency(Number(c || 0))}
                </span>
            ),
        },
        {
            title: 'Mode of Payment',
            dataIndex: 'payment_method',
            key: 'pm',
            width: 70,
            align: 'center' as const,
            render: (pm: string) => (
                <Tag
                    color={
                        pm === 'cash'
                            ? 'green'
                            : pm === 'card'
                              ? 'blue'
                              : 'purple'
                    }
                    style={{ fontSize: 9, margin: 0 }}
                >
                    {(pm || 'cash').toUpperCase()}
                </Tag>
            ),
        },
        {
            title: 'By',
            key: 'recorded_by',
            width: 100,
            render: (_: any, r: FuelSale) => (
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                    {r.recorded_by
                        ? `${r.recorded_by.first_name} ${r.recorded_by.last_name}`
                        : '-'}
                </span>
            ),
        },
    ];

    const productColumns = [
        {
            title: 'Product',
            dataIndex: 'type',
            key: 'type',
            width: 180,
            render: (t: string) => (
                <Space>
                    <ShopOutlined style={{ color: 'var(--success)' }} />
                    <span
                        style={{
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                        }}
                    >
                        {t}
                    </span>
                </Space>
            ),
        },
        {
            title: 'Price/L',
            key: 'price',
            width: 120,
            align: 'right' as const,
            render: (_: any, r: FuelProduct) => {
                const price = getActivePrice(r.id);
                return (
                    <span style={{ fontWeight: 600, color: 'var(--success)' }}>
                        ₱{formatNumber(price)}
                    </span>
                );
            },
        },
        {
            title: 'Stock (L)',
            key: 'stock',
            width: 110,
            align: 'right' as const,
            render: (_: any, r: FuelProduct) => {
                const st = getCurrentStock(r.id);
                const isLow = st > 0 && st <= lowStockThreshold;
                const isOut = st <= 0;
                const stockColor = isOut
                    ? 'var(--danger)'
                    : isLow
                      ? 'var(--warning)'
                      : 'var(--success)';
                return (
                    <Space size={4}>
                        <span
                            style={{
                                fontWeight: 600,
                                fontSize: 13,
                                color: stockColor,
                            }}
                        >
                            {formatNumber(st)} L
                        </span>
                        {(isLow || isOut) && (
                            <WarningOutlined
                                style={{ color: stockColor, fontSize: 12 }}
                            />
                        )}
                    </Space>
                );
            },
        },
        {
            title: 'Cost Value',
            key: 'costVal',
            width: 120,
            align: 'right' as const,
            render: (_: any, r: FuelProduct) => (
                <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                    {formatCurrency(getTotalCostValue(r.id))}
                </span>
            ),
        },
        {
            title: 'Selling Value',
            key: 'sellVal',
            width: 120,
            align: 'right' as const,
            render: (_: any, r: FuelProduct) => (
                <span
                    style={{
                        fontWeight: 600,
                        color: 'var(--success)',
                        fontSize: 12,
                    }}
                >
                    {formatCurrency(getTotalSellingValue(r.id))}
                </span>
            ),
        },
        {
            title: 'Sold (L)',
            key: 'sold',
            width: 90,
            align: 'right' as const,
            render: (_: any, r: FuelProduct) => (
                <span style={{ color: 'var(--info)' }}>
                    {formatNumber(getTotalSold(r.id))} L
                </span>
            ),
        },
        {
            title: 'Profit',
            key: 'rev',
            width: 110,
            align: 'right' as const,
            render: (_: any, r: FuelProduct) => (
                <span style={{ fontWeight: 600, color: 'var(--success)' }}>
                    {formatCurrency(getTotalRevenue(r.id))}
                </span>
            ),
        },
        {
            title: '',
            key: 'act',
            width: 40,
            align: 'center' as const,
            render: (_: any, r: FuelProduct) => (
                <Tooltip title="Edit">
                    <Button
                        type="text"
                        size="small"
                        icon={
                            <EditOutlined style={{ color: 'var(--success)' }} />
                        }
                        onClick={() => handleEdit(r)}
                    />
                </Tooltip>
            ),
        },
    ];

    const salesColumns = [
        {
            title: 'Date',
            dataIndex: 'created_at',
            key: 'date',
            width: 120,
            render: (d: string) => (
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {d ? dayjs(d).format('MM/DD HH:mm') : '-'}
                </span>
            ),
        },
        {
            title: 'Txn #',
            dataIndex: 'transaction_number',
            key: 'txn',
            width: 120,
            render: (t: string) => (
                <Tag color="blue" style={{ fontSize: 10, margin: 0 }}>
                    {t || 'N/A'}
                </Tag>
            ),
        },
        {
            title: 'Product',
            key: 'prod',
            width: 140,
            render: (_: any, r: FuelSale) => (
                <Tag color="blue" style={{ fontSize: 10, margin: 0 }}>
                    {r.fuel_product?.type || 'N/A'}
                </Tag>
            ),
        },
        {
            title: 'Liters',
            dataIndex: 'liters',
            key: 'liters',
            width: 90,
            align: 'right' as const,
            render: (l: any) => (
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {formatNumber(Number(l || 0))} L
                </span>
            ),
        },
        {
            title: 'Price/L',
            dataIndex: 'price_per_liter',
            key: 'ppl',
            width: 90,
            align: 'right' as const,
            render: (p: any) => (
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {formatCurrency(Number(p || 0))}
                </span>
            ),
        },
        {
            title: 'Total',
            dataIndex: 'total_amount',
            key: 'total',
            width: 100,
            align: 'right' as const,
            render: (a: any) => (
                <span
                    style={{
                        fontWeight: 600,
                        color: 'var(--success)',
                        fontSize: 12,
                    }}
                >
                    {formatCurrency(Number(a || 0))}
                </span>
            ),
        },
        {
            title: 'Payment',
            dataIndex: 'amount_paid',
            key: 'paid',
            width: 100,
            align: 'right' as const,
            render: (a: any) => (
                <span
                    style={{
                        fontWeight: 600,
                        color: 'var(--primary)',
                        fontSize: 12,
                    }}
                >
                    {formatCurrency(Number(a || 0))}
                </span>
            ),
        },
        {
            title: 'Change',
            dataIndex: 'change_amount',
            key: 'change',
            width: 90,
            align: 'right' as const,
            render: (c: any) => (
                <span
                    style={{
                        fontSize: 12,
                        color:
                            Number(c || 0) > 0
                                ? 'var(--success)'
                                : 'var(--text-tertiary)',
                    }}
                >
                    {formatCurrency(Number(c || 0))}
                </span>
            ),
        },
        {
            title: 'Mode of Payment',
            dataIndex: 'payment_method',
            key: 'pm',
            width: 70,
            align: 'center' as const,
            render: (pm: string) => (
                <Tag
                    color={
                        pm === 'cash'
                            ? 'green'
                            : pm === 'card'
                              ? 'blue'
                              : 'purple'
                    }
                    style={{ fontSize: 9, margin: 0 }}
                >
                    {(pm || 'cash').toUpperCase()}
                </Tag>
            ),
        },
        {
            title: 'By',
            key: 'recorded_by',
            width: 100,
            render: (_: any, r: FuelSale) => (
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                    {r.recorded_by
                        ? `${r.recorded_by.first_name} ${r.recorded_by.last_name}`
                        : '-'}
                </span>
            ),
        },
    ];

    const remittanceColumns = [
        {
            title: 'Staff',
            key: 'staff',
            render: (_: any, record: Remittance) => (
                <Space>
                    <span style={{ color: 'var(--text-primary)' }}>
                        {record.staff?.first_name} {record.staff?.last_name}
                    </span>
                    <span
                        style={{ color: 'var(--text-tertiary)', fontSize: 12 }}
                    >
                        ({record.staff?.email})
                    </span>
                </Space>
            ),
        },
        {
            title: 'Remittance Date',
            dataIndex: 'remittance_date',
            key: 'date',
            render: (date: string) => (
                <span style={{ color: 'var(--text-secondary)' }}>
                    {dayjs(date).format('YYYY-MM-DD')}
                </span>
            ),
        },
        {
            title: 'Claimed Amount',
            dataIndex: 'remitted_amount',
            key: 'claimed',
            render: (amount: number) => (
                <span style={{ fontWeight: 600, color: 'var(--success)' }}>
                    {formatCurrency(amount)}
                </span>
            ),
        },
        {
            title: 'Actual Sales',
            dataIndex: 'actual_sales_amount',
            key: 'actual',
            render: (amount: number, record: Remittance) => {
                const diff =
                    record.actual_sales_amount - record.remitted_amount;
                const isMatch = Math.abs(diff) < 0.01;
                return (
                    <Space>
                        <span style={{ color: 'var(--text-primary)' }}>
                            {formatCurrency(amount)}
                        </span>
                        {!isMatch && (
                            <Tag
                                color={diff > 0 ? 'red' : 'orange'}
                                style={{ margin: 0 }}
                            >
                                {diff > 0
                                    ? `Short by ${formatCurrency(diff)}`
                                    : `Over by ${formatCurrency(Math.abs(diff))}`}
                            </Tag>
                        )}
                        {isMatch && (
                            <Tag color="green" style={{ margin: 0 }}>
                                Exact Match
                            </Tag>
                        )}
                    </Space>
                );
            },
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                const color =
                    status === 'approved'
                        ? 'green'
                        : status === 'rejected'
                          ? 'red'
                          : 'orange';
                return (
                    <Tag color={color} style={{ margin: 0 }}>
                        {status.toUpperCase()}
                    </Tag>
                );
            },
        },
        {
            title: 'Submitted',
            dataIndex: 'created_at',
            key: 'created',
            render: (date: string) => (
                <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                    {dayjs(date).format('YYYY-MM-DD HH:mm')}
                </span>
            ),
        },
        {
            title: 'Action',
            key: 'action',
            render: (_: any, record: Remittance) => (
                <Space>
                    <Button
                        type="primary"
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => handleViewRemittance(record)}
                    >
                        View
                    </Button>
                    {record.status === 'pending' && (
                        <>
                            <Button
                                type="primary"
                                size="small"
                                icon={<CheckOutlined />}
                                onClick={() =>
                                    handleReview(record.id, 'approved')
                                }
                                style={{
                                    backgroundColor: '#52c41a',
                                    borderColor: '#52c41a',
                                }}
                                loading={approvingId === record.id}
                            >
                                Approve
                            </Button>
                            <Button
                                danger
                                size="small"
                                icon={<CloseOutlined />}
                                onClick={() =>
                                    handleReview(record.id, 'rejected')
                                }
                                loading={approvingId === record.id}
                            >
                                Reject
                            </Button>
                        </>
                    )}
                </Space>
            ),
        },
    ];

    // ─── Tabs ─────────────────────────────────────────────────────────────────

    const tabItems = [
        {
            key: 'today',
            label: (
                <span style={{ color: 'var(--text-secondary)' }}>
                    <CalendarOutlined /> Today's Sales{' '}
                    {todayTotalTransactions > 0 && (
                        <Badge
                            count={todayTotalTransactions}
                            style={{ marginLeft: 6 }}
                        />
                    )}
                </span>
            ),
            children: (
                <>
                    <div
                        style={{
                            marginBottom: 12,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: 8,
                        }}
                    >
                        <Space>
                            <Tag color="green" style={{ margin: 0 }}>
                                Txn: {todayTotalTransactions}
                            </Tag>
                            <Tag color="blue" style={{ margin: 0 }}>
                                {formatNumber(todayTotalLiters)} L
                            </Tag>
                            <Tag color="orange" style={{ margin: 0 }}>
                                {formatCurrency(todayTotalRevenue)}
                            </Tag>
                        </Space>
                        <Button
                            icon={<DownloadOutlined />}
                            onClick={exportTodayReport}
                            disabled={!todaySales.length}
                            size="small"
                            style={{ borderRadius: 6 }}
                        >
                            Export Today
                        </Button>
                    </div>
                    <Table
                        dataSource={todaySales}
                        columns={todaySalesColumns}
                        rowKey="id"
                        pagination={false}
                        size="small"
                        style={{ width: '100%' }}
                    />
                </>
            ),
        },
        {
            key: 'products',
            label: (
                <span style={{ color: 'var(--text-secondary)' }}>
                    <ShopOutlined /> Products ({products.length})
                </span>
            ),
            children: (
                <>
                    <Table
                        dataSource={products}
                        columns={productColumns}
                        loading={loading}
                        rowKey="id"
                        pagination={false}
                        size="small"
                        style={{ width: '100%' }}
                    />
                    {products.length > 0 && (
                        <div
                            style={{
                                marginTop: 12,
                                padding: '12px 16px',
                                background: 'var(--bg-surface-hover)',
                                borderRadius: 8,
                                border: '1px solid var(--border-color)',
                                display: 'flex',
                                gap: 24,
                                flexWrap: 'wrap',
                            }}
                        >
                            <div
                                style={{
                                    fontSize: 12,
                                    color: 'var(--text-secondary)',
                                }}
                            >
                                <span
                                    style={{
                                        fontWeight: 600,
                                        color: 'var(--text-primary)',
                                        marginRight: 4,
                                    }}
                                >
                                    Total Cost Value:
                                </span>
                                <span
                                    style={{
                                        fontWeight: 700,
                                        color: 'var(--text-primary)',
                                        fontSize: 14,
                                    }}
                                >
                                    {formatCurrency(grandTotalCostValue)}
                                </span>
                            </div>
                            <div
                                style={{
                                    fontSize: 12,
                                    color: 'var(--text-secondary)',
                                }}
                            >
                                <span
                                    style={{
                                        fontWeight: 600,
                                        color: 'var(--text-primary)',
                                        marginRight: 4,
                                    }}
                                >
                                    Total Selling Value:
                                </span>
                                <span
                                    style={{
                                        fontWeight: 700,
                                        color: 'var(--success)',
                                        fontSize: 14,
                                    }}
                                >
                                    {formatCurrency(grandTotalSellingValue)}
                                </span>
                            </div>
                            <div
                                style={{
                                    fontSize: 12,
                                    color: 'var(--text-secondary)',
                                }}
                            >
                                <span
                                    style={{
                                        fontWeight: 600,
                                        color: 'var(--text-primary)',
                                        marginRight: 4,
                                    }}
                                >
                                    Profit:
                                </span>
                                <span
                                    style={{
                                        fontWeight: 700,
                                        color:
                                            grandTotalSellingValue -
                                                grandTotalCostValue >
                                            0
                                                ? 'var(--success)'
                                                : 'var(--danger)',
                                        fontSize: 14,
                                    }}
                                >
                                    {formatCurrency(
                                        grandTotalSellingValue -
                                            grandTotalCostValue,
                                    )}
                                </span>
                            </div>
                        </div>
                    )}
                </>
            ),
        },
        {
            key: 'sales',
            label: (
                <span style={{ color: 'var(--text-secondary)' }}>
                    <DollarOutlined /> Sales History ({totalSalesCount})
                </span>
            ),
            children: (
                <>
                    <div style={{ marginBottom: 12, textAlign: 'right' }}>
                        <Button
                            icon={<DownloadOutlined />}
                            onClick={exportSalesReport}
                            disabled={!sales.length}
                            size="small"
                            style={{ borderRadius: 6 }}
                        >
                            Export All Sales
                        </Button>
                    </div>
                    <Table
                        dataSource={sales}
                        columns={salesColumns}
                        rowKey="id"
                        pagination={false}
                        size="small"
                        style={{ width: '100%' }}
                    />
                </>
            ),
        },
        {
            key: 'remittances',
            label: (
                <span style={{ color: 'var(--text-secondary)' }}>
                    <CheckOutlined style={{ color: 'var(--primary)' }} />{' '}
                    Remittances (
                    {remittances.filter((r) => r.status === 'pending').length})
                </span>
            ),
            children: (
                <>
                    <div
                        style={{
                            marginBottom: 16,
                            display: 'flex',
                            gap: 12,
                            flexWrap: 'wrap',
                        }}
                    >
                        <Select
                            placeholder="Filter by Status"
                            style={{ width: 150 }}
                            allowClear
                            onChange={(value) =>
                                setRemFilters((prev) => ({
                                    ...prev,
                                    status: value || '',
                                }))
                            }
                        >
                            <Select.Option value="pending">
                                Pending
                            </Select.Option>
                            <Select.Option value="approved">
                                Approved
                            </Select.Option>
                            <Select.Option value="rejected">
                                Rejected
                            </Select.Option>
                        </Select>
                        <DatePicker
                            placeholder="Date From"
                            onChange={(date) =>
                                setRemFilters((prev) => ({
                                    ...prev,
                                    date_from: date
                                        ? date.format('YYYY-MM-DD')
                                        : '',
                                }))
                            }
                        />
                        <DatePicker
                            placeholder="Date To"
                            onChange={(date) =>
                                setRemFilters((prev) => ({
                                    ...prev,
                                    date_to: date
                                        ? date.format('YYYY-MM-DD')
                                        : '',
                                }))
                            }
                        />
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={fetchRemittances}
                            loading={remLoading}
                        >
                            Refresh
                        </Button>
                    </div>
                    <Table
                        dataSource={remittances}
                        columns={remittanceColumns}
                        rowKey="id"
                        loading={remLoading}
                        pagination={{ pageSize: 10 }}
                        size="small"
                        locale={{ emptyText: 'No remittance records found.' }}
                    />
                </>
            ),
        },
    ];

    if (loading)
        return (
            <div className="page-loading">
                <Spin size="large" tip="Loading fuel products..." />
            </div>
        );

    const statCardBodyStyle: React.CSSProperties = {
        height: 120,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Fuel Products</h1>
                    <p className="page-description">
                        Manage fuel products and view current stock levels.
                    </p>
                </div>
                <Tooltip title={`Low stock threshold: ${lowStockThreshold} L`}>
                    <Badge
                        count={
                            lowStockProducts.length + outOfStockProducts.length
                        }
                    >
                        <Button
                            icon={<BellOutlined />}
                            onClick={() => {
                                thresholdForm.setFieldsValue({
                                    threshold: lowStockThreshold,
                                });
                                setThresholdModalVisible(true);
                            }}
                            style={{ borderRadius: 6 }}
                        >
                            Stock Alert Settings
                        </Button>
                    </Badge>
                </Tooltip>
            </div>

            {outOfStockProducts.length > 0 && (
                <Alert
                    type="error"
                    showIcon
                    icon={<WarningOutlined />}
                    style={{ marginBottom: 10, borderRadius: 8 }}
                    message={
                        <span>
                            <strong style={{ color: 'var(--danger-text)' }}>
                                Out of Stock:{' '}
                            </strong>
                            <span style={{ color: 'var(--text-primary)' }}>
                                {outOfStockProducts
                                    .map((p) => p.type)
                                    .join(', ')}
                            </span>
                        </span>
                    }
                />
            )}
            {lowStockProducts.length > 0 && (
                <Alert
                    type="warning"
                    showIcon
                    icon={<WarningOutlined />}
                    style={{ marginBottom: 16, borderRadius: 8 }}
                    message={
                        <span>
                            <strong style={{ color: 'var(--warning-text)' }}>
                                Low Stock:{' '}
                            </strong>
                            <span style={{ color: 'var(--text-primary)' }}>
                                {lowStockProducts
                                    .map(
                                        (p) =>
                                            `${p.type} (${formatNumber(getCurrentStock(p.id))} L)`,
                                    )
                                    .join(', ')}
                            </span>
                        </span>
                    }
                />
            )}

            {/* Product Stat Cards */}
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                {products.map((product, index) => {
                    const stock = getCurrentStock(product.id);
                    const price = getActivePrice(product.id);
                    const sold = getTotalSold(product.id);
                    const revenue = getTotalRevenue(product.id);
                    const isLowStock = stock > 0 && stock <= lowStockThreshold;
                    const isOutOfStock = stock <= 0;
                    const cardClasses = [
                        'stat-card stat-card-success',
                        'stat-card stat-card-secondary',
                        'stat-card stat-card-warning',
                        'stat-card stat-card-primary',
                    ];
                    const cls = cardClasses[index % cardClasses.length];
                    const iconColor = isOutOfStock
                        ? 'var(--danger)'
                        : isLowStock
                          ? 'var(--warning)'
                          : 'var(--success)';
                    return (
                        <Col xs={24} sm={12} lg={6} key={product.id}>
                            <Card
                                className={cls}
                                style={{ borderRadius: 14, height: '100%' }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                    }}
                                >
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 8,
                                                marginBottom: 4,
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontWeight: 700,
                                                    fontSize: 14,
                                                    color: 'var(--text-primary)',
                                                }}
                                            >
                                                {product.type}
                                            </span>
                                            <Tag
                                                style={{
                                                    fontSize: 10,
                                                    margin: 0,
                                                }}
                                            >
                                                {product.type}
                                            </Tag>
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 20,
                                                fontWeight: 700,
                                                color: iconColor,
                                                marginBottom: 6,
                                            }}
                                        >
                                            {formatCurrency(stock * price)}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 12,
                                                color: 'var(--text-secondary)',
                                            }}
                                        >
                                            Stock:{' '}
                                            <span
                                                style={{
                                                    fontWeight: 600,
                                                    color: iconColor,
                                                }}
                                            >
                                                {formatNumber(stock)} L
                                            </span>
                                            {isLowStock && (
                                                <Tag
                                                    color="warning"
                                                    style={{
                                                        marginLeft: 6,
                                                        fontSize: 10,
                                                        padding: '0 4px',
                                                        margin: 0,
                                                    }}
                                                >
                                                    Low
                                                </Tag>
                                            )}
                                            {isOutOfStock && (
                                                <Tag
                                                    color="error"
                                                    style={{
                                                        marginLeft: 6,
                                                        fontSize: 10,
                                                        padding: '0 4px',
                                                        margin: 0,
                                                    }}
                                                >
                                                    Out
                                                </Tag>
                                            )}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 12,
                                                color: 'var(--text-secondary)',
                                                marginTop: 4,
                                            }}
                                        >
                                            Price:{' '}
                                            <span
                                                style={{
                                                    fontWeight: 600,
                                                    color: 'var(--text-primary)',
                                                }}
                                            >
                                                ₱{formatNumber(price)}/L
                                            </span>
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 12,
                                                color: 'var(--text-secondary)',
                                                marginTop: 4,
                                            }}
                                        >
                                            Sold:{' '}
                                            <span
                                                style={{
                                                    fontWeight: 600,
                                                    color: 'var(--info)',
                                                }}
                                            >
                                                {formatNumber(sold)} L
                                            </span>{' '}
                                            ·{' '}
                                            <span
                                                style={{
                                                    fontWeight: 600,
                                                    color: 'var(--success)',
                                                }}
                                            >
                                                {formatCurrency(revenue)}
                                            </span>
                                        </div>
                                    </div>
                                    {isOutOfStock || isLowStock ? (
                                        <WarningOutlined
                                            style={{
                                                color: iconColor,
                                                fontSize: 26,
                                                opacity: 0.8,
                                                flexShrink: 0,
                                            }}
                                        />
                                    ) : (
                                        <FireOutlined
                                            style={{
                                                color: 'var(--success)',
                                                fontSize: 26,
                                                opacity: 0.8,
                                                flexShrink: 0,
                                            }}
                                        />
                                    )}
                                </div>
                            </Card>
                        </Col>
                    );
                })}
            </Row>

            {/* Summary Stat Cards */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} lg={6}>
                    <Card
                        className="stat-card stat-card-success"
                       styles={{ body: statCardBodyStyle }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                height: '100%',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    height: '100%',
                                }}
                            >
                                <div
                                    style={{
                                        color: 'var(--text-tertiary)',
                                        fontSize: 11,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                        fontWeight: 600,
                                    }}
                                >
                                    Total Products
                                </div>
                                <div
                                    style={{
                                        fontSize: 28,
                                        fontWeight: 700,
                                        color: 'var(--text-primary)',
                                        lineHeight: 1.1,
                                    }}
                                >
                                    {totalProducts}
                                </div>
                            </div>
                            <ShopOutlined
                                style={{
                                    color: 'var(--success)',
                                    fontSize: 24,
                                    opacity: 0.8,
                                    marginTop: 4,
                                }}
                            />
                        </div>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card
                        className="stat-card stat-card-secondary"
                       styles={{ body: statCardBodyStyle }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                height: '100%',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    height: '100%',
                                }}
                            >
                                <div
                                    style={{
                                        color: 'var(--text-tertiary)',
                                        fontSize: 11,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                        fontWeight: 600,
                                    }}
                                >
                                    Total Stock Value
                                </div>
                                <div
                                    style={{
                                        fontSize: 22,
                                        fontWeight: 700,
                                        color: 'var(--text-primary)',
                                        lineHeight: 1.1,
                                    }}
                                >
                                    {formatCurrency(totalStockValue)}
                                </div>
                            </div>
                            <InboxOutlined
                                style={{
                                    color: 'var(--info)',
                                    fontSize: 24,
                                    opacity: 0.8,
                                    marginTop: 4,
                                }}
                            />
                        </div>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card
                        className="stat-card stat-card-success"
                       styles={{ body: statCardBodyStyle }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                height: '100%',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    height: '100%',
                                }}
                            >
                                <div
                                    style={{
                                        color: 'var(--text-tertiary)',
                                        fontSize: 11,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                        fontWeight: 600,
                                    }}
                                >
                                    Total Sales
                                </div>
                                <div
                                    style={{
                                        fontSize: 28,
                                        fontWeight: 700,
                                        color: 'var(--text-primary)',
                                        lineHeight: 1.1,
                                    }}
                                >
                                    {totalSalesCount}
                                </div>
                                <div
                                    style={{
                                        color: 'var(--text-tertiary)',
                                        fontSize: 11,
                                        marginTop: 4,
                                    }}
                                >
                                    {formatNumber(totalLitersSold)} L sold
                                </div>
                            </div>
                            <DollarOutlined
                                style={{
                                    color: 'var(--success)',
                                    fontSize: 24,
                                    opacity: 0.8,
                                    marginTop: 4,
                                }}
                            />
                        </div>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card
                        className="stat-card stat-card-warning"
                       styles={{ body: statCardBodyStyle }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                height: '100%',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    height: '100%',
                                }}
                            >
                                <div
                                    style={{
                                        color: 'var(--text-tertiary)',
                                        fontSize: 11,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                        fontWeight: 600,
                                    }}
                                >
                                    Total Revenue
                                </div>
                                <div
                                    style={{
                                        fontSize: 22,
                                        fontWeight: 700,
                                        color: 'var(--warning)',
                                        lineHeight: 1.1,
                                    }}
                                >
                                    {formatCurrency(totalRevenue)}
                                </div>
                            </div>
                            <FireOutlined
                                style={{
                                    color: 'var(--warning)',
                                    fontSize: 24,
                                    opacity: 0.8,
                                    marginTop: 4,
                                }}
                            />
                        </div>
                    </Card>
                </Col>
            </Row>

            {/* Main Table */}
            <Card
                title={
                    <Space>
                        <FireOutlined style={{ color: 'var(--primary)' }} />
                        <span
                            style={{
                                fontWeight: 600,
                                color: 'var(--text-primary)',
                            }}
                        >
                            Fuel Products Management
                        </span>
                    </Space>
                }
                extra={
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleAdd}
                        style={{ borderRadius: 6 }}
                    >
                        Add Product
                    </Button>
                }
                style={{ borderRadius: 12 }}
                bodyStyle={{ padding: '16px', overflow: 'visible' }}
            >
                <Tabs defaultActiveKey="today" items={tabItems} />
            </Card>

            {/* Add/Edit Modal */}
            <Modal
                title={
                    <Space>
                        {editingProduct ? <EditOutlined /> : <PlusOutlined />}
                        <span style={{ color: 'var(--text-primary)' }}>
                            {editingProduct ? 'Edit Product' : 'Add Product'}
                        </span>
                    </Space>
                }
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={null}
                width={450}
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                    <Form.Item
                        name="type"
                        label="Fuel Type"
                        rules={[{ required: true }]}
                    >
                        <Input
                            placeholder="e.g., Gasoline, Diesel"
                            size="large"
                            style={{ borderRadius: 6 }}
                        />
                    </Form.Item>
                    <Form.Item
                        name="selling_price"
                        label="Selling Price (₱/L)"
                        rules={[{ required: true }]}
                    >
                        <InputNumber
                            style={{ width: '100%', borderRadius: 6 }}
                            size="large"
                            min={0}
                            step={0.01}
                            placeholder="Enter selling price"
                        />
                    </Form.Item>
                    <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
                        <Button
                            onClick={() => setModalVisible(false)}
                            size="large"
                            style={{ marginRight: 8, borderRadius: 6 }}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            size="large"
                            style={{ borderRadius: 6 }}
                        >
                            {editingProduct ? 'Update' : 'Add'}
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Stock Alert Settings Modal */}
            <Modal
                title={
                    <Space>
                        <SettingOutlined style={{ color: 'var(--warning)' }} />
                        <span style={{ color: 'var(--text-primary)' }}>
                            Stock Alert Settings
                        </span>
                    </Space>
                }
                open={thresholdModalVisible}
                onCancel={() => setThresholdModalVisible(false)}
                footer={null}
                width={420}
            >
                <Form
                    form={thresholdForm}
                    layout="vertical"
                    onFinish={handleSaveThreshold}
                >
                    <div
                        style={{
                            marginBottom: 16,
                            padding: 12,
                            background: 'var(--warning-bg)',
                            borderRadius: 8,
                            border: '1px solid var(--warning-border)',
                        }}
                    >
                        <div
                            style={{
                                fontSize: 13,
                                color: 'var(--warning-text)',
                            }}
                        >
                            When stock falls below this threshold, a{' '}
                            <strong>Low Stock Warning</strong> will appear.
                        </div>
                    </div>
                    <Form.Item
                        name="threshold"
                        label="Low Stock Threshold (Liters)"
                        rules={[{ required: true }]}
                    >
                        <InputNumber
                            style={{ width: '100%', borderRadius: 6 }}
                            size="large"
                            min={1}
                            step={100}
                            placeholder="e.g., 500"
                            addonAfter="L"
                        />
                    </Form.Item>
                    <div
                        style={{
                            fontSize: 12,
                            color: 'var(--text-secondary)',
                            marginBottom: 16,
                        }}
                    >
                        Current:{' '}
                        <strong style={{ color: 'var(--warning)' }}>
                            {lowStockThreshold} L
                        </strong>
                    </div>
                    <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
                        <Button
                            onClick={() => setThresholdModalVisible(false)}
                            size="large"
                            style={{ borderRadius: 6 }}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            size="large"
                            style={{ marginLeft: 8, borderRadius: 6 }}
                        >
                            Save Setting
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Remittance Detail Modal */}
            <Modal
                title={
                    <span style={{ color: 'var(--text-primary)' }}>
                        Remittance Details
                    </span>
                }
                open={remModalVisible}
                onCancel={() => setRemModalVisible(false)}
                footer={null}
                width={600}
            >
                {selectedRemittance && (
                    <div>
                        <p>
                            <strong style={{ color: 'var(--text-secondary)' }}>
                                Staff:
                            </strong>{' '}
                            <span style={{ color: 'var(--text-primary)' }}>
                                {selectedRemittance.staff?.first_name}{' '}
                                {selectedRemittance.staff?.last_name}
                            </span>
                        </p>
                        <p>
                            <strong style={{ color: 'var(--text-secondary)' }}>
                                Email:
                            </strong>{' '}
                            <span style={{ color: 'var(--text-primary)' }}>
                                {selectedRemittance.staff?.email}
                            </span>
                        </p>
                        <p>
                            <strong style={{ color: 'var(--text-secondary)' }}>
                                Remittance Date:
                            </strong>{' '}
                            <span style={{ color: 'var(--text-primary)' }}>
                                {dayjs(
                                    selectedRemittance.remittance_date,
                                ).format('YYYY-MM-DD')}
                            </span>
                        </p>
                        <p>
                            <strong style={{ color: 'var(--text-secondary)' }}>
                                Claimed Amount:
                            </strong>{' '}
                            <span style={{ color: 'var(--success)' }}>
                                {formatCurrency(
                                    selectedRemittance.remitted_amount,
                                )}
                            </span>
                        </p>
                        <p>
                            <strong style={{ color: 'var(--text-secondary)' }}>
                                Actual Sales:
                            </strong>{' '}
                            <span style={{ color: 'var(--text-primary)' }}>
                                {formatCurrency(
                                    selectedRemittance.actual_sales_amount,
                                )}
                            </span>
                        </p>
                        <p>
                            <strong style={{ color: 'var(--text-secondary)' }}>
                                Status:
                            </strong>{' '}
                            <Tag
                                color={
                                    selectedRemittance.status === 'approved'
                                        ? 'green'
                                        : selectedRemittance.status ===
                                            'rejected'
                                          ? 'red'
                                          : 'orange'
                                }
                                style={{ margin: 0 }}
                            >
                                {selectedRemittance.status.toUpperCase()}
                            </Tag>
                        </p>
                        {selectedRemittance.reviewed_at && (
                            <p>
                                <strong
                                    style={{ color: 'var(--text-secondary)' }}
                                >
                                    Reviewed At:
                                </strong>{' '}
                                <span style={{ color: 'var(--text-primary)' }}>
                                    {dayjs(
                                        selectedRemittance.reviewed_at,
                                    ).format('YYYY-MM-DD HH:mm')}
                                </span>
                            </p>
                        )}
                        {selectedRemittance.status === 'pending' && (
                            <Space style={{ marginTop: 16 }}>
                                <Button
                                    type="primary"
                                    icon={<CheckOutlined />}
                                    onClick={() =>
                                        handleReview(
                                            selectedRemittance.id,
                                            'approved',
                                        )
                                    }
                                >
                                    Approve
                                </Button>
                                <Button
                                    danger
                                    icon={<CloseOutlined />}
                                    onClick={() =>
                                        handleReview(
                                            selectedRemittance.id,
                                            'rejected',
                                        )
                                    }
                                >
                                    Reject
                                </Button>
                            </Space>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default FuelProducts;
