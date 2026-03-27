// import css
import './assets/amocrm.css';
// import vue componets
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { useSipStore } from './stores/sip.store';
import { useGlobalsStore } from './stores/globals.store';

let _pinia = null;

function fetchSettings(widget) {
    const currentUser = widget.system.amouser;
    console.log(currentUser);
    console.log(widget.crm_post);
    widget.crm_post(
        `https://amocrm.utel.uz/api/lookup/${currentUser}`,
        {},
        (response) => {
            let data;
            try {
                data = JSON.parse(response);
            } catch (e) {
                AMOCRM.notifications.show_message({
                    header: 'Utel Widget',
                    text: 'Не удалось загрузить настройки виджета: некорректный ответ',
                    type: 'error',
                });
                return;
            }
            if (!data || !data.domain || !data.token) {
                AMOCRM.notifications.show_message({
                    header: 'Utel Widget',
                    text: 'Не удалось загрузить настройки виджета: некорректный ответ',
                    type: 'error',
                });
                return;
            }
            const { domain, token } = data;
            window.__AMO_UTEL_WIDGET_SETTINGS__ = { domain, token };
            sessionStorage.setItem('utel-widget-domain', domain);
            sessionStorage.setItem('utel-widget-token', token);
            useGlobalsStore(_pinia).isSettingsReady = true;
        },
        'text',
        (error) => {
            console.log('error', error);
        }
    );
}

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
        const cachedDomain = sessionStorage.getItem('utel-widget-domain');
        const cachedToken = sessionStorage.getItem('utel-widget-token');
        if (cachedDomain && cachedToken) {
            window.__AMO_UTEL_WIDGET_SETTINGS__ = { domain: cachedDomain, token: cachedToken };
            useGlobalsStore(_pinia).isSettingsReady = true;
        } else {
            fetchSettings(widget);
        }
        window.addEventListener('utel-widget:unauthorized', () => {
            sessionStorage.removeItem('utel-widget-domain');
            sessionStorage.removeItem('utel-widget-token');
            useGlobalsStore(_pinia).isSettingsReady = false;
            fetchSettings(widget);
        }, { once: true });
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
