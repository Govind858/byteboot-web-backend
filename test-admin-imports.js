async function test() {
    try {
        const { AdminJS } = await import('adminjs');
        const AdminJSMongoose = await import('@adminjs/mongoose');
        const AdminJSExpress = await import('@adminjs/express');

        console.log('AdminJS Class:', typeof AdminJS);
        if (AdminJS) {
            console.log('registerAdapter:', typeof AdminJS.registerAdapter);
        }

        console.log('AdminJSExpress keys:', Object.keys(AdminJSExpress));

        if (typeof AdminJS.registerAdapter === 'function') {
            AdminJS.registerAdapter(AdminJSMongoose);
            console.log('Adapter registered successfully');
        }

        // Check buildRouter
        console.log('buildRouter:', typeof AdminJSExpress.buildRouter);

        if (AdminJS && AdminJSExpress.buildRouter) {
            console.log("Looks like we have a fix!");
        }

    } catch (e) {
        console.error('Error:', e);
    }
}
test();
