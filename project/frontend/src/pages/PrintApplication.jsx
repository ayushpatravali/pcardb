import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getApplication } from '../services/api';
import { Printer, ArrowLeft, CheckCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const PrintApplication = () => {
    const { t } = useLanguage();
    const { id } = useParams();
    const navigate = useNavigate();
    const [app, setApp] = useState(null);
    const [details, setDetails] = useState(null);
    const [localIndex, setLocalIndex] = useState(null);
    const [loading, setLoading] = useState(true);
    const autoTriggered = useRef(false);

    const downloadPdf = () => window.open(`/api/pdf/download/${id}`, '_blank');

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
                        className="w-full sm:w-auto px-8 py-4 bg-primary-700 text-white rounded-xl font-bold hover:bg-primary-800 shadow-lg shadow-blue-200 flex items-center justify-center transition-all transform hover:-translate-y-1"
                    >
                        <Printer className="mr-3" size={24} />
                        Download
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
