const axios = require('axios');
axios.post('https://api.belcon.com.tr/api/leads', {
    title: 'Test Lead',
    status: 'new',
    active_project_id: 1,
    customer_id: null,
    unit_id: null,
    expected_value: null,
    source: 'web'
}).then(res => console.log(res.data)).catch(err => console.log(err.response ? err.response.data : err.message));
