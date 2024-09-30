// load-header.js
fetch('header.html')
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text();
    })
    .then(data => {
        document.querySelector('.section-1').innerHTML = data;
        console.log('Header loaded successfully');
    })
    .catch(e => {
        console.error('There was a problem loading the header:', e);
        document.querySelector('.section-1').innerHTML = '<p>Error loading header. Please refresh the page.</p>';
    });