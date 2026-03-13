import api from '../axios'

export const useAmocrm = () => {
    return {
        getInfo: () => api.get('/amocrm/widget/info'),
    }
}
