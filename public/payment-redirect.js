// Bookmarklet script to redirect from backend to frontend payment pages
// Copy this code and create a bookmark, or paste into browser console

(function() {
    const currentUrl = window.location.href;
    const frontendUrl = 'https://smart-home-web-seven.vercel.app';
    
    // Extract query params
    const urlParams = new URLSearchParams(window.location.search);
    const params = urlParams.toString();
    
    let redirectUrl = '';
    
    // Determine which page to redirect to
    if (currentUrl.includes('/payment/cancel') || currentUrl.includes('cancel=true')) {
        redirectUrl = `${frontendUrl}/payment/cancel${params ? '?' + params : ''}`;
    } else if (currentUrl.includes('/payment/success')) {
        redirectUrl = `${frontendUrl}/payment/success${params ? '?' + params : ''}`;
    } else {
        // Default to cancel page
        redirectUrl = `${frontendUrl}/payment/cancel${params ? '?' + params : ''}`;
    }
    
    // Redirect immediately
    window.location.href = redirectUrl;
})();

