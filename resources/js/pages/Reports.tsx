import React, { useState } from 'react';
import {
    Card, Row, Col, Button, DatePicker, Select, Table, message,
    Space, Statistic, Spin, Empty, Tag
} from 'antd';
import {
    FilePdfOutlined,
    FileExcelOutlined,
    PrinterOutlined,
    DollarOutlined,
    CarOutlined,
    FireOutlined,
    ReloadOutlined,
    DownloadOutlined,
    CalendarOutlined,
    FileTextOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../services/api';

const { RangePicker } = DatePicker;
const { Option } = Select;

const PRIMARY_COLOR = '#10B981';
const SECONDARY_COLOR = '#3B82F6';
const WARNING_COLOR = '#F59E0B';
const TEXT_PRIMARY = '#1F2937';
const TEXT_SECONDARY = '#6B7280';

interface ReportData {
    transactions: any[];
    summary: {
        total_revenue: number;
        total_transactions: number;
        average_transaction: number;
        parking_revenue?: number;
        fuel_revenue?: number;
        total_liters_sold?: number;
        total_parking_nights?: number;
        parking_transactions?: number;
        fuel_transactions?: number;
    };
    date_range: {
        start: string;
        end: string;
    };
}

const Reports: React.FC = () => {
    const [reportType, setReportType] = useState<string>('combined');
    const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [reportData, setReportData] = useState<ReportData | null>(null);

    const generateReport = async () => {
        if (!dateRange) {
            message.warning('Please select date range');
            return;
        }
        setLoading(true);
        try {
            const [start, end] = dateRange;
            const response = await api.get('/reports/generate', {
                params: {
                    type: reportType,
                    start_date: start.format('YYYY-MM-DD'),
                    end_date: end.format('YYYY-MM-DD')
                }
            });
            if (response.data) {
                setReportData(response.data);
                message.success('Report generated successfully');
            } else {
                message.warning('No data found');
            }
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to generate report');
        } finally {
            setLoading(false);
        }
    };


    const exportPDF = () => {
        if (!reportData) {
            message.warning('Please generate a report first');
            return;
        }
        window.print();
        message.success('Use Ctrl+P to save as PDF');
    };

 
    const exportExcel = () => {
        if (!reportData) {
            message.warning('Please generate a report first');
            return;
        }

        const { summary, transactions, date_range } = reportData;
        const [start, end] = dateRange ? [date_range.start, date_range.end] : ['', ''];

        // Build CSV content
        let csv = '';
        
        // Header
        csv += 'Park & Fuel Management System\n';
        csv += `Report Type:,${reportType === 'parking' ? 'Parking' : reportType === 'fuel' ? 'Fuel' : 'Combined'}\n`;
        csv += `Period:,${start} to ${end}\n\n`;
        
        // Summary
        csv += 'SUMMARY\n';
        csv += `Total Revenue,P${(summary.total_revenue || 0).toFixed(2)}\n`;
        csv += `Total Transactions,${summary.total_transactions || 0}\n`;
        if (summary.parking_revenue !== undefined) {
            csv += `Parking Revenue,P${summary.parking_revenue.toFixed(2)}\n`;
            csv += `Parking Transactions,${summary.parking_transactions || 0}\n`;
            csv += `Total Nights,${summary.total_parking_nights || 0}\n`;
        }
        if (summary.fuel_revenue !== undefined) {
            csv += `Fuel Revenue,P${summary.fuel_revenue.toFixed(2)}\n`;
            csv += `Fuel Transactions,${summary.fuel_transactions || 0}\n`;
            csv += `Total Liters,${(summary.total_liters_sold || 0).toFixed(2)} L\n`;
        }
        csv += '\n';
        
        // Transactions
        csv += 'Transaction #,Type,Details,Quantity,Date,Paid,Change,Amount\n';
        
        transactions.forEach((t: any) => {
            const txnNum = (t.transaction_number || 'N/A').replace(/,/g, '');
            const type = t.type === 'parking' ? 'Parking' : 'Fuel';
            
            let details = '';
            let quantity = '';
            let date = '';
            let paid = '';
            let change = '';
            
            if (t.type === 'parking') {
                const customerName = t.customer ? `${t.customer.first_name} ${t.customer.last_name}` : 'N/A';
                details = `Slot ${t.slot_number || 'N/A'} - ${customerName}`;
                quantity = `${t.nights_stayed || 0} nights`;
                date = t.check_in_date || '-';
                paid = `P${(t.amount_paid || 0).toFixed(2)}`;
                change = `P${(t.change_amount || 0).toFixed(2)}`;
            } else {
              
                const productType = t.fuel_product?.type || 'N/A';
                details = productType;
                quantity = `${(t.liters || 0).toFixed(2)} L`;
                date = t.date || '-';
                paid = `P${(t.amount_paid || 0).toFixed(2)}`;
                change = `P${(t.change_amount || 0).toFixed(2)}`;
            }
            
            const amount = `P${(t.total_amount || 0).toFixed(2)}`;
            
            csv += `"${txnNum}","${type}","${details}","${quantity}","${date}","${paid}","${change}","${amount}"\n`;
        });
        
        // Download CSV
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `report_${reportType}_${start}_to_${end}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        message.success('CSV downloaded successfully (open with Excel)');
    };

    const printReport = () => {
        window.print();
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount || 0);
    };

    const formatNumber = (num: number) => {
        return num?.toLocaleString() || '0';
    };

    const parkingColumns = [
        { title: 'Transaction #', dataIndex: 'transaction_number', key: 'transaction_number', render: (text: string) => <Tag color="blue">{text}</Tag> },
        { title: 'Customer', key: 'customer', render: (_: any, record: any) => record.customer ? `${record.customer.first_name} ${record.customer.last_name}` : 'N/A' },
        { title: 'Slot', dataIndex: 'slot_number', key: 'slot_number', render: (text: string) => <Tag color="purple">{text}</Tag> },
        { title: 'Check In', dataIndex: 'check_in_date', key: 'check_in_date' },
        { title: 'Check Out', dataIndex: 'check_out_date', key: 'check_out_date' },
        { title: 'Nights', dataIndex: 'nights_stayed', key: 'nights', align: 'center' as const, render: (n: number) => <Tag color="green">{n || 1}n</Tag> },
        { title: 'Paid', dataIndex: 'amount_paid', key: 'amount_paid', align: 'right' as const, render: (a: number) => formatCurrency(a) },
        { title: 'Change', dataIndex: 'change_amount', key: 'change_amount', align: 'right' as const, render: (c: number) => formatCurrency(c) },
        { title: 'Amount', dataIndex: 'total_amount', key: 'amount', align: 'right' as const, render: (a: number) => <span style={{ fontWeight: 600, color: PRIMARY_COLOR }}>{formatCurrency(a)}</span> },
    ];


    const fuelColumns = [
        { title: 'Transaction #', dataIndex: 'transaction_number', key: 'transaction_number', render: (text: string) => <Tag color="orange">{text}</Tag> },
        { title: 'Product', key: 'product', render: (_: any, record: any) => record.fuel_product?.type || 'N/A' },
        { title: 'Liters', dataIndex: 'liters', key: 'liters', align: 'right' as const, render: (l: number) => `${formatNumber(l)} L` },
        { title: 'Price/L', dataIndex: 'price_per_liter', key: 'price_per_liter', align: 'right' as const, render: (p: number) => formatCurrency(p) },
        { title: 'Total', dataIndex: 'total_amount', key: 'total', align: 'right' as const, render: (a: number) => <span style={{ fontWeight: 600, color: PRIMARY_COLOR }}>{formatCurrency(a)}</span> },
    ];

    const getTransactionsForTable = () => {
        if (!reportData) return [];
        if (reportType === 'parking') return reportData.transactions.filter((t: any) => t.type === 'parking');
        if (reportType === 'fuel') return reportData.transactions.filter((t: any) => t.type === 'fuel');
        return reportData.transactions;
    };

    const getTableColumns = () => {
        if (reportType === 'parking') return parkingColumns;
        if (reportType === 'fuel') return fuelColumns;
        return parkingColumns;
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title"><FileTextOutlined style={{ color: PRIMARY_COLOR, marginRight: 12 }} />Reports</h1>
                    <p className="page-description">Generate and export business reports for parking and fuel sales</p>
                </div>
            </div>

            <Card style={{ marginBottom: 24 }}>
                <Row gutter={[16, 16]} align="bottom">
                    <Col xs={24} sm={8}>
                        <Select value={reportType} onChange={setReportType} style={{ width: '100%' }} size="large">
                            <Option value="combined">Combined Report</Option>
                            <Option value="parking">Parking Report</Option>
                            <Option value="fuel">Fuel Report</Option>
                        </Select>
                    </Col>
                    <Col xs={24} sm={12}>
                        <RangePicker style={{ width: '100%' }} size="large" onChange={(d) => setDateRange(d as any)} />
                    </Col>
                    <Col xs={24} sm={4}>
                        <Button type="primary" size="large" onClick={generateReport} loading={loading} icon={<DownloadOutlined />} style={{ width: '100%' }}>Generate</Button>
                    </Col>
                </Row>
            </Card>

            {reportData && (
                <Card style={{ marginBottom: 24 }}>
                    <Space size="middle">
                        <Button icon={<PrinterOutlined />} onClick={exportPDF} size="large">Print / PDF</Button>
                        <Button icon={<FileExcelOutlined />} onClick={exportExcel} size="large">Export CSV</Button>
                        <Button icon={<ReloadOutlined />} onClick={generateReport} size="large">Refresh</Button>
                    </Space>
                </Card>
            )}

            {reportData && (
                <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
                    <Col xs={24} sm={12} lg={6}>
                        <Card>
                            <Statistic title="Total Revenue" value={reportData.summary.total_revenue} formatter={(v) => formatCurrency(v as number)} valueStyle={{ color: '#065F46', fontSize: 24, fontWeight: 700 }} prefix={<DollarOutlined />} />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card>
                            <Statistic title="Total Transactions" value={reportData.summary.total_transactions} valueStyle={{ color: '#1E40AF', fontSize: 24, fontWeight: 700 }} />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card>
                            <Statistic title="Avg Transaction" value={reportData.summary.average_transaction} formatter={(v) => formatCurrency(v as number)} valueStyle={{ color: '#92400E', fontSize: 24, fontWeight: 700 }} />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card>
                            <div style={{ color: TEXT_SECONDARY, fontSize: 13 }}>Date Range</div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY }}>{reportData.date_range.start} to {reportData.date_range.end}</div>
                        </Card>
                    </Col>
                </Row>
            )}

            {reportData && (
                <Card title={<Space><FileTextOutlined style={{ color: PRIMARY_COLOR }} /><span>Transaction Details</span><Tag color="blue">{getTransactionsForTable().length} records</Tag></Space>}>
                    <Table columns={getTableColumns()} dataSource={getTransactionsForTable()} rowKey="id" pagination={{ pageSize: 10 }} loading={loading} />
                </Card>
            )}

            {!reportData && !loading && (
                <Card style={{ textAlign: 'center', padding: 40 }}>
                    <FileTextOutlined style={{ fontSize: 64, color: TEXT_SECONDARY, marginBottom: 16 }} />
                    <h3>No Report Generated</h3>
                    <p style={{ color: TEXT_SECONDARY }}>Select report type and date range, then click Generate.</p>
                </Card>
            )}

            {loading && <Card style={{ textAlign: 'center', padding: 40 }}><Spin size="large" /></Card>}
        </div>
    );
};

export default Reports;