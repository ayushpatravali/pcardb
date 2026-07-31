import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
});

// Request interceptor to add the auth header
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export const login = async (username, password) => {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    // Use api instance so it works both with Vite proxy (dev) and in production
    const response = await api.post('/token', formData);
    if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('role', response.data.role);
    }
    return response.data;
};

export const registerUser = async (data) => {
    const response = await api.post('/register', data);
    return response.data;
};

export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
};

export const fetchApplications = async () => {
    const response = await api.get('/applications/');
    return response.data;
};

export const fetchStats = async () => {
    const response = await api.get('/applications/stats');
    return response.data;
};

export const getApplication = async (id) => {
    const response = await api.get(`/applications/${id}`);
    return response.data;
};

export const updateApplication = async (id, data) => {
    const response = await api.put(`/applications/${id}`, data);
    return response.data;
};

export const approveApplication = async (id) => {
    const response = await api.put(`/applications/${id}/status`, { status: "approved" });
    return response.data;
};

export const deleteApplication = async (id) => {
    const response = await api.delete(`/applications/${id}`);
    return response.data;
};

export const downloadApplication = async (id) => {
    const response = await api.post(`/applications/${id}/generate`, {}, {
        responseType: 'blob', // Important for file download
    });

    // Create a link to download the blob
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;

    // Try to get filename from header or default
    const contentDisposition = response.headers['content-disposition'];
    let fileName = `application_${id}.xlsx`;
    if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename\*?=['"]?(?:UTF-\d['"]*)?([^;\r\n"']*)['"]?;?/);
        if (fileNameMatch && fileNameMatch[1]) {
            fileName = decodeURIComponent(fileNameMatch[1].replace(/['"]/g, '').trim());
        }
    }

    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
};

export default api;
