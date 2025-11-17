// components/OrderDetail.tsx (新组件：订单详情页，使用提供的 Receipt Card)
import React from 'react';
import styled from 'styled-components';

interface OrderItem {
  id: string;
  product: {
    name: string;
    mainImage: string;
  };
  variant: {
    size: string;
    color: string;
  };
  quantity: number;
  price: number;  // 单价
}

interface Order {
  id: string;
  orderNumber: string;
  totalAmount: number;
  customerName: string;
  customerPhone: string;
  address: string;
  createdAt: Date;
  items: OrderItem[];
}

interface OrderDetailProps {
  order: Order;  // 传入订单数据
}

const OrderDetail: React.FC<OrderDetailProps> = ({ order }) => {
  const total = Number(order.totalAmount).toFixed(2);
  const date = new Date(order.createdAt).toLocaleDateString('en-US', { 
    month: 'short', 
    day: '2-digit', 
    year: 'numeric' 
  });
  const time = new Date(order.createdAt).toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: true 
  });

  return (
    <StyledWrapper>
      <div className="receipt">
        <p className="shop-name">E-Shop</p>
        <p className="info">
          订单号 : {order.orderNumber}<br />
          用户名 : {order.customerName}<br />
          电  话 : {order.customerPhone}<br />
          地  址 : {order.address}<br />
          日  期 : {date}<br />
          时  间 : {time}
        </p>
        <table>
          <thead>
            <tr>
              <th>商品</th>
              <th>数量</th>
              <th>价格</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, index) => (
              <tr key={item.id || index}>
                <td>{item.product.name} ({item.variant.size}/{item.variant.color})</td>
                <td>{item.quantity}</td>
                <td>￥{(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="total">
          <p>总计:</p>
          <p>￥{total}</p>
        </div>
        <p className="thanks">Thank you for shopping with us!</p>
      </div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  .receipt {
    width: 100%;
    max-width: 300px;
    background: white;
    border: 2px dashed #ccc;
    padding: 15px;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    margin: 0 auto;
  }
  .shop-name {
    font-size: 1.2rem;
    font-weight: bold;
    text-align: center;
    margin-bottom: 10px;
  }
  .info {
    text-align: left;
    font-size: 0.85rem;
    margin-bottom: 15px;
    line-height: 1.4;
  }
  .receipt table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 15px;
    font-size: 0.85rem;
  }
  .receipt table th,
  .receipt table td {
    padding: 6px 4px;
    text-align: left;
    border-bottom: 1px solid #eee;
  }
  .receipt table th {
    background-color: #f8f8f8;
    font-weight: bold;
  }
  .total {
    display: flex;
    justify-content: space-between;
    font-size: 1rem;
    font-weight: bold;
    margin-bottom: 15px;
    padding-top: 10px;
    border-top: 2px dashed #ccc;
  }
  .thanks {
    font-size: 0.85rem;
    text-align: center;
    margin-top: 10px;
    color: #666;
  }
`;

export default OrderDetail;