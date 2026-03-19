// import css
import './assets/amocrm.css';
// import vue componets
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { useSipStore } from './stores/sip.store';

let _pinia = null;

const Widget = {
    currnetArea: "",
    appElement: "",
    render(widget) {
        window.__AMO_UTEL_WIDGET_SETTINGS__ = widget.get_settings();
        window.__AMO_UTEL_WIDGET_SYSTEM__ = widget.system;
        console.log('render callback');
        const wrapperElement = document.querySelector('#utel-widget-app');
        if (wrapperElement) {
            return true;
        }
        const appElement = document.createElement('div');
        appElement.setAttribute('id', 'utel-widget-app');
        this.appElement = appElement;
        console.log('render callback', widget.get_settings());
        const container = $("body");
        $(container).append(this.appElement);
        _pinia = createPinia();
        const app = createApp(App);
        app.use(_pinia);
        window.vue = app;
        app.mount('#utel-widget-app');
        return true;
    },
    init(widget) {
        this.currnetArea = widget.system.area;
        widget.add_action('phone', function (data) {
            if (!data?.value || !_pinia) return;
            useSipStore(_pinia).makeCall(data.value);
        });
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