import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getApplication } from '../services/api';
import { Printer, FileSpreadsheet, ArrowLeft, CheckCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const PrintApplication = () => {
    const { t } = useLanguage();
    const { id } = useParams();
    const navigate = useNavigate();
    const [app, setApp] = useState(null);
    const [details, setDetails] = useState(null);
    const [localIndex, setLocalIndex] = useState(null);
    const [loading, setLoading] = useState(true);

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

    if (loading) return <div className="p-8 text-center text-xl">Loading Application Data...</div>;
    if (!app) return (
        <div className="p-8 text-center text-red-600">
            <h2 className="text-2xl font-bold mb-2">Error Loading Application</h2>
            <p>Could not find application with ID: {id}</p>
        </div>
    );

    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        return new Date(dateStr).toLocaleDateString('en-GB');
    };

    const isManager = localStorage.getItem('role') === 'manager';
    const displayId = isManager ? app.id : (localIndex || app.id);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-10 max-w-2xl w-full text-center">
                
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle size={40} className="text-green-600" />
                </div>
                
                <h1 className="text-3xl font-black text-gray-800 mb-2">Application Ready!</h1>
                <p className="text-lg text-gray-500 mb-8">
                    Application <span className="font-bold text-gray-700">#{displayId} ({app.applicant_name_kn})</span> is ready to be exported.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
                    <button
                        onClick={() => window.open(`/api/pdf/download/${id}`, '_blank')}
                        className="w-full sm:w-auto px-8 py-4 bg-primary-700 text-white rounded-xl font-bold hover:bg-primary-800 shadow-lg shadow-blue-200 flex items-center justify-center transition-all transform hover:-translate-y-1"
                    >
                        <Printer className="mr-3" size={24} />
                        Download 21-Page PDF
                    </button>

                    <button
                        onClick={() => window.open(`/api/excel/download-excel/${id}`, '_blank')}
                        className="w-full sm:w-auto px-8 py-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 shadow-lg shadow-green-200 flex items-center justify-center transition-all transform hover:-translate-y-1"
                    >
                        <FileSpreadsheet className="mr-3" size={24} />
                        Download Raw Excel
                    </button>
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
