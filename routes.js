const routes = require('next-routes')();
routes
    .add('/distribusikopi', 'distribusikopi')
    .add('/distribusikopi/dashboard', 'distribusikopi/dashboard')
    .add('/distribusikopi/:address', 'distribusikopi/show')

module.exports = routes