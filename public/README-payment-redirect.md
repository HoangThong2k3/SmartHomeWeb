# Hướng dẫn xử lý redirect từ Backend về Frontend

## Vấn đề
Backend đang serve trang HTML tĩnh thay vì redirect về frontend, nên không có nút "Về Dashboard".

## Giải pháp tạm thời

### Cách 1: Sử dụng Bookmarklet (Khuyến nghị)

1. Copy đoạn code sau:
```javascript
javascript:(function(){const u=window.location.href;const f='https://smart-home-web-seven.vercel.app';const p=new URLSearchParams(window.location.search).toString();const r=u.includes('/payment/cancel')||u.includes('cancel=true')?`${f}/payment/cancel${p?'?'+p:''}`:`${f}/payment/success${p?'?'+p:''}`;window.location.href=r;})();
```

2. Tạo bookmark mới trong browser
3. Paste code vào URL của bookmark
4. Khi vào trang backend, click bookmark để tự động redirect về frontend

### Cách 2: Sử dụng Browser Console

1. Mở trang backend (URL có `smarthomes-fdbehwcuaaexaggv.eastasia-01.azurewebsites.net`)
2. Nhấn F12 để mở Developer Tools
3. Vào tab Console
4. Paste code sau và nhấn Enter:

```javascript
const frontendUrl = 'https://smart-home-web-seven.vercel.app';
const urlParams = new URLSearchParams(window.location.search).toString();
const isCancel = window.location.href.includes('/payment/cancel') || window.location.href.includes('cancel=true');
const redirectUrl = isCancel 
    ? `${frontendUrl}/payment/cancel${urlParams ? '?' + urlParams : ''}`
    : `${frontendUrl}/payment/success${urlParams ? '?' + urlParams : ''}`;
window.location.href = redirectUrl;
```

### Cách 3: Copy URL Frontend

Nếu đang ở trang backend, copy URL sau và paste vào thanh địa chỉ:

- **Cancel**: `https://smart-home-web-seven.vercel.app/payment/cancel`
- **Success**: `https://smart-home-web-seven.vercel.app/payment/success`

## Giải pháp vĩnh viễn

Cần sửa backend để redirect về frontend URL thay vì serve trang HTML tĩnh:

1. Khi nhận callback từ PayOS, backend nên redirect 302/301 về:
   - Success: `https://smart-home-web-seven.vercel.app/payment/success?orderCode=...&code=...`
   - Cancel: `https://smart-home-web-seven.vercel.app/payment/cancel?cancel=true&...`

2. Không serve trang HTML tĩnh, chỉ redirect.

