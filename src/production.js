// import css
import './assets/amocrm.css';
// import vue componets
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';

// const app = createApp(App);
// app.use(store);
// app.mount('#app');


const Widget = {
    currnetArea: "",
    appElement: "",
    render(widget) {
        window.__AMO_UTEL_WIDGET_SETTINGS__ = widget.get_settings();
        window.__AMO_UTEL_WIDGET_SYSTEM__ = widget.system;
        const appElement = document.createElement('div');
        appElement.setAttribute('id', 'utel-widget-app');
        this.appElement = appElement;
        console.log('render callback', widget.get_settings());
        const container = $("body");
        $(container).append(this.appElement);
        const pinia = createPinia();
        const app = createApp(App);
        app.use(pinia);
        window.vue = app;
        app.mount('#utel-widget-app');
        return true;
    },
    init(widget) {
        this.currnetArea = widget.system.area;
        console.log('init callback');
        return true;
    },
    bind_actions(widget) {
        console.log('bind_actions callback');
        return true;
    },
    settings(widget) {
        return true;
    },
    onSave(widget) {
        return true;
    },
    destroy(widget) {
        console.log("destroy");
    },
    contacts_selected(widget) {
        console.log("conatct_selected");
    },
    leads_selected(widget) {
        console.log("lead_selected");
    },
    tasks_selected(widget) {
        console.log("task_selected");
    }
};

export default Widget;