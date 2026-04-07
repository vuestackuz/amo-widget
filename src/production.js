// import css
import './assets/amocrm.css';
// import vue componets
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import axios from 'axios';
import { useSipStore } from './stores/sip.store';

let _pinia = null;

const Widget = {
    currnetArea: "",
    appElement: "",
    render(widget) {
        window.__AMO_UTEL_WIDGET_SETTINGS__ = widget.get_settings();
        window.__AMO_UTEL_WIDGET_SYSTEM__ = widget.system;
        const wrapperElement = document.querySelector('#utel-widget-app');
        if (wrapperElement) {
            return true;
        }
        const appElement = document.createElement('div');
        appElement.setAttribute('id', 'utel-widget-app');
        this.appElement = appElement;
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
            const sipStore = useSipStore(_pinia);
            if (sipStore.hasCredential) {
                sipStore.makeCall(data.value);
            } else {
                const settings = window.__AMO_UTEL_WIDGET_SETTINGS__;
                const amoCRMUserId = AMOCRM.constant('user').id;
                axios.post(
                    settings.domain + '/api/v1/integration/amocrm/widget/originate',
                    {
                        name: data?.model?.name,
                        exten: data.value
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${settings.token}`,
                            'Content-Type': 'application/json',
                            'Amocrm-User-Id': amoCRMUserId,
                        }
                    }
                ).then((response) => {
                    const result = response.data;
                    if (!result.success) {
                        AMOCRM.notifications.add_error({
                            header: 'Error',
                            text: result.message,
                            date: Math.ceil(Date.now() / 1000),
                        });
                    }
                }).catch((error) => {
                    AMOCRM.notifications.add_error({
                        header: 'Error',
                        text: error.message,
                        date: Math.ceil(Date.now() / 1000),
                    });
                });
            }
        });
        return true;
    },
    bind_actions(widget) {
        return true;
    },
    settings(widget) {
      const container = $(".widget-settings .widget_settings_block");
      const p = document.createElement('p');
      p.textContent = 'Добро пожаловать в Utel Widget';
      container.html(p);
        return true;
    },
    onSave(widget) {
        return true;
    },
    destroy(widget) {
    },
    contacts_selected(widget) {
    },
    leads_selected(widget) {
    },
    tasks_selected(widget) {
    }
};

export default Widget;
