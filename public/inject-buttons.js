// Script to inject buttons into backend payment pages
// Paste this into browser console when on backend payment page

(function() {
    // Check if buttons already exist
    if (document.getElementById('frontend-redirect-buttons')) {
        return;
    }
    
    const frontendUrl = 'https://smart-home-web-seven.vercel.app';
    const urlParams = new URLSearchParams(window.location.search).toString();
    const isCancel = window.location.href.includes('/payment/cancel') || window.location.href.includes('cancel=true');
    
    // Create button container
    const buttonContainer = document.createElement('div');
    buttonContainer.id = 'frontend-redirect-buttons';
    buttonContainer.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 10000;
        display: flex;
        gap: 12px;
        flex-direction: column;
        max-width: 400px;
        width: 90%;
    `;
    
    // Create Dashboard button
    const dashboardBtn = document.createElement('a');
    dashboardBtn.href = `${frontendUrl}/user-dashboard`;
    dashboardBtn.textContent = '🏠 Về Dashboard';
    dashboardBtn.style.cssText = `
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 14px 28px;
        background: #2563eb;
        color: white;
        text-decoration: none;
        border-radius: 8px;
        font-weight: 600;
        font-size: 16px;
        box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
        transition: all 0.2s;
    `;
    dashboardBtn.onmouseover = function() {
        this.style.background = '#1d4ed8';
        this.style.transform = 'translateY(-2px)';
        this.style.boxShadow = '0 6px 16px rgba(37, 99, 235, 0.4)';
    };
    dashboardBtn.onmouseout = function() {
        this.style.background = '#2563eb';
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.3)';
    };
    
    // Create Subscribe button (only for cancel page)
    if (isCancel) {
        const subscribeBtn = document.createElement('a');
        subscribeBtn.href = `${frontendUrl}/subscribe`;
        subscribeBtn.textContent = '↩️ Quay lại đăng ký';
        subscribeBtn.style.cssText = `
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 14px 28px;
            background: #e5e7eb;
            color: #374151;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            transition: all 0.2s;
        `;
        subscribeBtn.onmouseover = function() {
            this.style.background = '#d1d5db';
            this.style.transform = 'translateY(-2px)';
        };
        subscribeBtn.onmouseout = function() {
            this.style.background = '#e5e7eb';
            this.style.transform = 'translateY(0)';
        };
        buttonContainer.appendChild(subscribeBtn);
    }
    
    buttonContainer.appendChild(dashboardBtn);
    
    // Append to body
    document.body.appendChild(buttonContainer);
    
    console.log('✅ Đã thêm nút vào trang!');
})();

