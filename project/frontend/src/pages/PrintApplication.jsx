import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { getApplication } from '../services/api';
import { Printer, ArrowLeft, CheckCircle, AlertTriangle, Pencil } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const PrintApplication = () => {
    const { t } = useLanguage();
    const { id } = useParams();
    const navigate = useNavigate();
    const [app, setApp] = useState(null);
    const [details, setDetails] = useState(null);
    const [localIndex, setLocalIndex] = useState(null);
    const [loading, setLoading] = useState(true);
    // null = not attempted/ok; [] would mean 422 without labels; [{key,label_kn,label_en}] otherwise
    const [missingFields, setMissingFields] = useState(null);
    const [downloading, setDownloading] = useState(false);
    const autoTriggered = useRef(false);

    // Fetch the PDF through the API client (auth header + real error handling)
    // instead of window.open: a raw tab used to show status-code JSON when
    // required fields were missing, stranding the operator with no way back.
    const downloadPdf = async () => {
        setDownloading(true);
        try {
            const res = await api.get(`/pdf/download/${id}`, { responseType: 'blob' });
            const url = URL.createObjectURL(res.data);
            const win = window.open(url, '_blank');
            if (!win) {
                // Popup blocked — fall back to a download link.
                const a = document.createElement('a');
                a.href = url;
                a.download = `application_${id}.pdf`;
                a.click();
            }
            setMissingFields(null);
        } catch (err) {
            if (err?.response?.status === 422) {
                let detail = null;
                try {
                    // responseType blob wraps the JSON error body in a Blob.
                    detail = JSON.parse(await err.response.data.text())?.detail;
                } catch { /* not JSON */ }
                const labeled = detail?.fields?.length
                    ? detail.fields
                    : (detail?.missing || []).map((k) => ({ key: k, label_kn: k, label_en: k }));
                setMissingFields(labeled);
            } else if (err?.response?.status === 401) {
                alert('ಲಾಗಿನ್ ಅವಧಿ ಮುಗಿದಿದೆ — ಹೊಸ ಟ್ಯಾಬ್‌ನಲ್ಲಿ ಮತ್ತೆ ಲಾಗಿನ್ ಮಾಡಿ ಈ ಪುಟಕ್ಕೆ ಮರಳಿ.\n\nSession expired — log in again in a new tab, then come back to this page.');
            } else {
                alert('Failed to generate the PDF. Please try again.');
            }
        } finally {
            setDownloading(false);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getApplication(id);
                setApp(data.application);
                setDetails(data.details);
                setLocalIndex(data.local_index);
            } catch (err) {
                console.error("Failed to load app", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    // Land straight here (from list "print" icon or right after saving) and
    // the PDF opens on its own — the button below is just a manual re-trigger
    // in case the browser blocked the automatic popup.
    useEffect(() => {
        if (app && !autoTriggered.current) {
            autoTriggered.current = true;
            downloadPdf();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [app]);

    if (loading) return <div className="p-8 text-center text-xl">Loading Application Data...</div>;
    if (!app) return (
        <div className="p-8 text-center text-red-600">
            <h2 className="text-2xl font-bold mb-2">Error Loading Application</h2>
            <p>Could not find application with ID: {id}</p>
        </div>
    );

    const isManager = localStorage.getItem('role') === 'manager';
    const displayId = isManager ? app.id : (localIndex || app.id);

    if (missingFields) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 sm:p-8">
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-10 max-w-2xl w-full text-center">
                    <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertTriangle size={40} className="text-amber-600" />
                    </div>
                    <h1 className="text-2xl font-black text-gray-800 mb-2">
                        ಅರ್ಜಿ ಉಳಿದಿದೆ — Application #{displayId} is SAVED
                    </h1>
                    <p className="text-gray-500 mb-6">
                        ಏನೂ ಕಳೆದುಹೋಗಿಲ್ಲ. ಪ್ರಿಂಟ್ ಮಾಡಲು ಈ ಮಾಹಿತಿ ಇನ್ನೂ ಬೇಕಾಗಿದೆ —<br />
                        Nothing is lost. The print packet still needs these fields:
                    </p>
                    <ul className="text-left inline-block mb-8 space-y-1">
                        {missingFields.map((f) => (
                            <li key={f.key} className="text-gray-700">
                                <span className="font-semibold">{f.label_kn}</span>
                                {f.label_en && f.label_en !== f.label_kn && (
                                    <span className="text-gray-400 text-sm"> — {f.label_en}</span>
                                )}
                            </li>
                        ))}
                    </ul>
                    <div className="flex flex-col items-center gap-4">
                        <button
                            onClick={() => navigate(`/applications/${id}/edit`)}
                            className="w-full sm:w-auto px-8 py-4 bg-primary-700 text-white rounded-xl font-bold hover:bg-primary-800 shadow-lg flex items-center justify-center transition-all"
                        >
                            <Pencil className="mr-3" size={20} />
                            ಸರಿಪಡಿಸಿ — Edit &amp; Fill These Fields
                        </button>
                        <button
                            onClick={() => navigate('/applications')}
                            className="text-gray-500 hover:text-gray-800 font-medium flex items-center justify-center transition-colors"
                        >
                            <ArrowLeft className="mr-2" size={18} />
                            Back to Applications
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 sm:p-8">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-10 max-w-2xl w-full text-center">

                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle size={40} className="text-green-600" />
                </div>

                <h1 className="text-3xl font-black text-gray-800 mb-2">Application Ready!</h1>
                <p className="text-lg text-gray-500 mb-8">
                    Application <span className="font-bold text-gray-700">#{displayId} ({app.applicant_name_kn})</span> is ready to be exported.
                </p>

                <div className="flex flex-col items-center justify-center gap-4 mb-10">
                    <button
                        onClick={downloadPdf}
                        disabled={downloading}
                        className="w-full sm:w-auto px-8 py-4 bg-primary-700 text-white rounded-xl font-bold hover:bg-primary-800 disabled:opacity-60 shadow-lg shadow-blue-200 flex items-center justify-center transition-all transform hover:-translate-y-1"
                    >
                        <Printer className="mr-3" size={24} />
                        {downloading ? 'Preparing…' : 'Download'}
                    </button>
                    <p className="text-sm text-gray-400">
                        Opened in a new tab automatically — use your browser's print button there if you'd rather print directly.
                    </p>
                </div>

                <div className="pt-6 border-t border-gray-100">
                    <button
                        onClick={() => navigate(-1)}
                        className="text-gray-500 hover:text-gray-800 font-medium flex items-center justify-center mx-auto transition-colors"
                    >
                        <ArrowLeft className="mr-2" size={18} />
                        Back to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PrintApplication;
