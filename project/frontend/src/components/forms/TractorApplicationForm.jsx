import React from 'react';

const TractorApplicationForm = ({ app, details, formatDate }) => {
    return (
        <div className="font-serif text-black leading-tight text-sm">
            {/* ================= PAGE 1: Header & Personal Details ================= */}
            <div className="w-[210mm] min-h-[297mm] mx-auto p-12 bg-white relative">

                {/* Header */}
                <div className="text-center border-b-2 border-black pb-2 mb-4">
                    <h1 className="text-xl font-bold">ದಿ ಗೋಕಾಕ ತಾಲೂಕಾ ಪ್ರಾಥಮಿಕ ಸಹಕಾರಿ ಕೃಷಿ ಮತ್ತು ಗ್ರಾಮೀಣ ಅಭಿವೃದ್ಧಿ ಬ್ಯಾಂಕ್ ನಿಯಮಿತ, ಗೋಕಾಕ</h1>
                    <p className="font-bold">ಜಿಲ್ಲೆ : ಬೆಳಗಾವಿ</p>
                </div>

                <div className="flex justify-between items-start mb-6 border border-black p-2">
                    <div className="w-2/3">
                        <h2 className="text-2xl font-bold underline mb-4">ಸಾಲದ ಅರ್ಜಿ (Loan Application)</h2>
                        <div className="grid grid-cols-1 gap-2 font-bold">
                            <p>ಸಾಲದ ಅರ್ಜಿ ಸಂಖ್ಯೆ : <span className="font-mono border-b border-black inline-block w-32 border-dashed"></span></p>
                            <p>ದಿನಾಂಕ : <span>{formatDate(app.created_at)}</span></p>
                            <p>ಯೋಜನೆ : <span className="underline">ಟ್ರ್ಯಾಕ್ಟರ ಟ್ರೇಲರ ಯೋಜನೆ</span></p>
                            <p>ಮೊಬೈಲ್ ಸಂ : <span>{app.mobile_no}</span></p>
                        </div>
                    </div>
                    <div className="w-1/3 flex flex-col items-center justify-center border-l border-black pl-2">
                        <div className="border border-black w-32 h-40 flex items-center justify-center text-xs text-center text-gray-400 mb-2">
                            ದರಖಾಸ್ತುದಾರರ<br />ಛಾಯಾ ಚಿತ್ರ<br />(Photo)
                        </div>
                    </div>
                </div>

                {/* Applicant Details Table */}
                <table className="w-full border-collapse border border-black mb-4">
                    <tbody>
                        <tr>
                            <td className="border border-black p-2 font-bold w-1/3">ಅರ್ಜಿದಾರರ ಹೆಸರು</td>
                            <td className="border border-black p-2 font-bold">{app.applicant_name_kn}</td>
                        </tr>
                        <tr>
                            <td className="border border-black p-2 font-bold">ತಂದೆ / ಗಂಡನ ಹೆಸರು</td>
                            <td className="border border-black p-2">{app.father_name_kn}</td>
                        </tr>
                        <tr>
                            <td className="border border-black p-2 font-bold">ವಯಸ್ಸು / ಲಿಂಗ</td>
                            <td className="border border-black p-2">{app.age} ವರ್ಷ / {app.gender}</td>
                        </tr>
                        <tr>
                            <td className="border border-black p-2 font-bold">ಜಾತಿ</td>
                            <td className="border border-black p-2">{app.caste}</td>
                        </tr>
                        <tr>
                            <td className="border border-black p-2 font-bold">ವಿಳಾಸ (ಗ್ರಾಮ / ಅಂಚೆ / ತಾಲೂಕಾ)</td>
                            <td className="border border-black p-2">
                                {app.village}, {app.hobli}, {app.taluk}, {app.district}
                            </td>
                        </tr>
                        <tr>
                            <td className="border border-black p-2 font-bold">ಬ್ಯಾಂಕ್ ಖಾತೆ ಸಂಖ್ಯೆ (A/c No)</td>
                            <td className="border border-black p-2 font-mono">{app.account_no || "________________"}</td>
                        </tr>
                        <tr>
                            <td className="border border-black p-2 font-bold">ಐಎಫ್‌ಎಸ್‌ಸಿ (IFSC Code)</td>
                            <td className="border border-black p-2 font-mono">{app.ifsc_code || "________________"}</td>
                        </tr>
                        {/* New Agriculture Details */}
                        <tr>
                            <td className="border border-black p-2 font-bold">ಬೆಳೆ (Crop) / ನೀರಾವರಿ ಮೂಲ</td>
                            <td className="border border-black p-2">{app.current_crop || "_______"} / {app.irrigation_source || "_______"}</td>
                        </tr>
                        <tr>
                            <td className="border border-black p-2 font-bold">ವಾರ್ಷಿಕ ಆದಾಯ (Annual Income)</td>
                            <td className="border border-black p-2">₹ {app.annual_income || "________________"}</td>
                        </tr>
                    </tbody>
                </table>

                {/* Financials / Loan Amount */}
                <div className="border border-black p-2 mb-4">
                    <p className="font-bold">ಬ್ಯಾಂಕಿನಿಂದ ಕೋರಿದ ಸಾಲದ ಮೊತ್ತ: <span className="text-xl">₹ {app.loan_amount || "________________"}</span></p>
                    <p className="text-xs mt-1">(ರಾಶಿ ಅಕ್ಷರಗಳಲ್ಲಿ: __________________________________________________________________)</p>
                </div>
            </div>

            {/* ================= PAGE 2: Land & Asset Details ================= */}
            <div className="w-[210mm] min-h-[297mm] mx-auto p-12 bg-white relative break-before-page">
                <h3 className="font-bold text-lg mb-4 text-center underline">ಜಮೀನು ಮತ್ತು ಆಸ್ತಿ ವಿವರಗಳು (Land & Asset Details)</h3>

                {/* Land Table */}
                <table className="w-full border-collapse border border-black mb-6 text-center">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border border-black p-2">ಕ್ರಮ ಸಂಖ್ಯೆ</th>
                            <th className="border border-black p-2">ಗ್ರಾಮ</th>
                            <th className="border border-black p-2">ಸರ್ವೆ ನಂಬರು</th>
                            <th className="border border-black p-2">ವಿಸ್ತೀರ್ಣ (ಎಕರಿ-ಗುಂಟೆ)</th>
                            <th className="border border-black p-2">ಆಕಾರ (Assessment)</th>
                            <th className="border border-black p-2">ಭೂಮಿಯ ವಿಧ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {details && details.survey_no ? (
                            <tr>
                                <td className="border border-black p-2">1</td>
                                <td className="border border-black p-2">{app.village}</td>
                                <td className="border border-black p-2">{details.survey_no || "-"}</td>
                                <td className="border border-black p-2">{details.area_acres || "-"}</td>
                                <td className="border border-black p-2">{details.assessment || "-"}</td>
                                <td className="border border-black p-2">{details.land_type || "-"}</td>
                            </tr>
                        ) : (
                            <>
                                <tr>
                                    <td className="border border-black p-2">1</td>
                                    <td className="border border-black p-2">{app.village}</td>
                                    <td className="border border-black p-2">&nbsp;</td>
                                    <td className="border border-black p-2">&nbsp;</td>
                                    <td className="border border-black p-2">&nbsp;</td>
                                    <td className="border border-black p-2">&nbsp;</td>
                                </tr>
                                <tr>
                                    <td className="border border-black p-2">2</td>
                                    <td className="border border-black p-2">&nbsp;</td>
                                    <td className="border border-black p-2">&nbsp;</td>
                                    <td className="border border-black p-2">&nbsp;</td>
                                    <td className="border border-black p-2">&nbsp;</td>
                                    <td className="border border-black p-2">&nbsp;</td>
                                </tr>
                            </>
                        )}
                    </tbody>
                </table>

                {/* Previous Loans */}
                <div className="mb-6">
                    <p className="font-bold mb-2">7. ಅರ್ಜಿದಾರರು ಪ್ರಾಥಮಿಕ ಬ್ಯಾಂಕು / ಹಣಕಾಸು ಸಂಸ್ಥೆಗಳಲ್ಲಿ ಪಡೆದಿರುವ ಸಾಲಗಳ ವಿವರ:</p>
                    <div className="border border-black h-24 p-2">
                        {/* Placeholder for manual entry */}
                        ನಿಯಿಲ್ಲ (Nil)
                    </div>
                </div>

                {/* Tractor Details (Specific to Scheme) */}
                <div className="mb-6">
                    <p className="font-bold mb-2">ಖರೀದಿಸಲು ಉದ್ದೇಶಿಸಿರುವ ಟ್ರ್ಯಾಕ್ಟರ್ ವಿವರ:</p>
                    <table className="w-full border-collapse border border-black text-left">
                        <tbody>
                            <tr>
                                <td className="border border-black p-2 font-bold w-1/2">ಟ್ರ್ಯಾಕ್ಟರ್ ಕಂಪನಿ (Make)</td>
                                <td className="border border-black p-2">{details?.tractor_make || "_______________"}</td>
                            </tr>
                            <tr>
                                <td className="border border-black p-2 font-bold">ಮಾಡೆಲ್ (Model)</td>
                                <td className="border border-black p-2">{details?.tractor_model || "_______________"}</td>
                            </tr>
                            <tr>
                                <td className="border border-black p-2 font-bold">ಅಶ್ವಶಕ್ತಿ (HP)</td>
                                <td className="border border-black p-2">{details?.tractor_hp || "_______________"}</td>
                            </tr>
                            <tr>
                                <td className="border border-black p-2 font-bold">ಟ್ರ್ಯಾಕ್ಟರ್ ಬೆಲೆ (Tractor Cost)</td>
                                <td className="border border-black p-2">₹ {details?.tractor_cost || "_______________"}</td>
                            </tr>
                            {/* Trailer & Implements */}
                            <tr>
                                <td className="border border-black p-2 font-bold">ಟ್ರೇಲರ್ ಕಂಪನಿ (Trailer Make)</td>
                                <td className="border border-black p-2">{details?.trailer_make || "_______________"}</td>
                            </tr>
                            <tr>
                                <td className="border border-black p-2 font-bold">ಟ್ರೇಲರ್ ಬೆಲೆ (Trailer Cost)</td>
                                <td className="border border-black p-2">₹ {details?.trailer_cost || "_______________"}</td>
                            </tr>
                            <tr>
                                <td className="border border-black p-2 font-bold">ಉಪಕರಣಗಳ ಬೆಲೆ (Implements Cost)</td>
                                <td className="border border-black p-2">₹ {details?.implement_cost || "_______________"}</td>
                            </tr>

                            {/* Totals */}
                            <tr className="bg-gray-100">
                                <td className="border border-black p-2 font-bold">ಒಟ್ಟು ಯೋಜನಾ ವೆಚ್ಚ (Total Project Cost)</td>
                                <td className="border border-black p-2 font-bold">₹ {details?.total_project_cost || "_______________"}</td>
                            </tr>
                            <tr>
                                <td className="border border-black p-2 font-bold">ಅಂಚಿನ ಹಣ (Margin Money)</td>
                                <td className="border border-black p-2">₹ {details?.margin_money || "_______________"}</td>
                            </tr>
                            <tr>
                                <td className="border border-black p-2 font-bold">ಬ್ಯಾಂಕ್ ಸಾಲ (Bank Loan)</td>
                                <td className="border border-black p-2">₹ {details?.loan_amount || app.loan_amount || "_______________"}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ================= PAGE 3: Checklist & Genealogy ================= */}
            <div className="w-[210mm] min-h-[297mm] mx-auto p-12 bg-white relative break-before-page">
                <h3 className="font-bold text-lg mb-4 text-center">3. ಲಗತ್ತಿಸಬೇಕಾದ ದಾಖಲೆಗಳು (Checklist)</h3>
                <div className="border border-black p-6 mb-8 text-sm grid grid-cols-2 gap-y-4">
                    <div>1. ಪಹಣಿ ಪತ್ರಿಕೆ (RTC) [ ]</div>
                    <div>7. ಮ್ಯುಟೇಶನ್ ಕಾಪಿ (Mutation) [ ]</div>
                    <div>2. ಅಕಾರ್‌ ಬಂದ್ (Akarband) [ ]</div>
                    <div>8. ಋಣಬಾಧೆ ಪ್ರಮಾಣ ಪತ್ರ (Encumbrance) [ ]</div>
                    <div>3. ವಂಶವೃಕ್ಷ (Genealogy) [ ]</div>
                    <div>9. ಆದಾಯ ಪ್ರಮಾಣ ಪತ್ರ (Income Cert) [ ]</div>
                    <div>4. ಜಾತಿ ಪ್ರಮಾಣ ಪತ್ರ (Caste Cert) [ ]</div>
                    <div>10. ಫೋಟೋ (Photos) [ ]</div>
                    <div>5. ಆಧಾರ ಕಾರ್ಡ್ (Aadhaar) [ ]</div>
                    <div>11. ರೇಷನ್ ಕಾರ್ಡ್ (Ration Card) [ ]</div>
                    <div>6. ಪಾನ್ ಕಾರ್ಡ್ (PAN) [ ]</div>
                    <div>12. ಇತರೆ (Others) [ ]</div>
                </div>

                {/* Genealogy Tree Box */}
                <div className="border-2 border-black h-[400px] p-4 relative">
                    <h4 className="font-bold text-center underline mb-4">ಅರ್ಜಿದಾರನ ವಂಶವೃಕ್ಷ (Applicant's Genealogy Tree)</h4>
                    <div className="absolute inset-0 flex items-center justify-center text-gray-300 pointer-events-none">
                        (ವಂಶವೃಕ್ಷವನ್ನು ಇಲ್ಲಿ ಬರೆಯಿರಿ / ಅಂಟಿಸಿರಿ)
                    </div>
                </div>
            </div>

            {/* ================= PAGE 4: Declaration & Office Use ================= */}
            <div className="w-[210mm] min-h-[297mm] mx-auto p-12 bg-white relative break-before-page">
                {/* Declaration */}
                <div className="mb-12">
                    <h4 className="font-bold underline mb-4">ಘೋಷಣೆ (Declaration)</h4>
                    <p className="leading-7 text-justify">
                        ಮೇಲೆ ನಮೂದಿಸಿದ ಮಾಹಿತಿಗಳು ನನ್ನ ತಿಳುವಳಿಕೆಯ ಪ್ರಕಾರ ಸತ್ಯ ಮತ್ತು ಸರಿಯಾಗಿರುತ್ತವೆ ಎಂದು ಈ ಮೂಲಕ ಘೋಷಿಸುತ್ತೇನೆ.
                        ಬ್ಯಾಂಕಿನ ನಿಯಮ ಮತ್ತು ನಿಬಂಧನೆಗಳಿಗೆ ಬದ್ಧನಾಗಿರುತ್ತೇನೆ. ನಾನು ಒದಗಿಸಿದ ಮಾಹಿತಿಗಳು ಸುಳ್ಳು ಎಂದು ಕಂಡುಬಂದಲ್ಲಿ,
                        ಬ್ಯಾಂಕು ಕೈಗೊಳ್ಳುವ ಯಾವುದೇ ಕಾನೂನು ಕ್ರಮಕ್ಕೆ ನಾನು ಬದ್ಧನಾಗಿರುತ್ತೇನೆ.
                    </p>
                </div>

                {/* Signatures */}
                <div className="flex justify-between items-end mt-20 mb-16">
                    <div className="text-center">
                        <div className="border-t border-black w-48 pt-2 font-bold">ಸ್ಥಳ: ಮೂಡಲಗಿ</div>
                        <div className="mt-2 font-bold">ದಿನಾಂಕ: ______________</div>
                    </div>
                    <div className="text-center">
                        <div className="border-t border-black w-48 pt-2 font-bold">ಅರ್ಜಿದಾರರ ಸಹಿ</div>
                        <div className="text-xs">(Signature of Applicant)</div>
                    </div>
                </div>

                {/* Office Use - Internal */}
                <div className="border-2 border-black p-6 bg-gray-50 print:bg-transparent break-inside-avoid">
                    <h5 className="font-bold text-center border-b border-black pb-2 mb-6 text-lg">ಕಚೇರಿಯ ಉಪಯೋಗಕ್ಕಾಗಿ (For Office Use Only)</h5>
                    <div className="flex justify-between mt-12 pt-4">
                        <div className="text-center w-1/3">
                            <div className="border-t border-black pt-1 font-bold">ವ್ಯವಸ್ಥಾಪರು</div>
                            <div className="text-xs">(Manager)</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ================= PAGE 5: Inspection Report Start ================= */}
            <div className="w-[210mm] min-h-[297mm] mx-auto p-12 bg-white relative break-before-page text-sm">
                <h3 className="text-xl font-bold text-center underline mb-6">ಸಾಲಗಾರರ ಸಂಪೂರ್ಣ ಮಾಹಿತಿ ಹಾಗೂ ವಿಶೇಷ ಸ್ಥಳ ಪರಿಶೀಲನಾ ವರದಿ</h3>
                <h4 className="text-lg font-bold text-center mb-6">(Borrower's Full Information & Special Spot Inspection Report)</h4>

                <div className="space-y-4 font-bold">
                    <div className="flex border-b border-black border-dotted pb-1">
                        <span className="w-1/2">1. ಸಾಲಗಾರರ ಹೆಸರು (Name of Borrower):</span>
                        <span className="w-1/2">{app.applicant_name_kn}</span>
                    </div>
                    <div className="flex border-b border-black border-dotted pb-1">
                        <span className="w-1/2">2. ರಹವಾಸಿ ಗ್ರಾಮ / ತಾಲ್ಲೂಕು (Residence):</span>
                        <span className="w-1/2">{app.village} / {app.taluk}</span>
                    </div>
                    <div className="flex border-b border-black border-dotted pb-1">
                        <span className="w-1/2">   ಕುಟುಂಬದ ಗಾತ್ರ (Family Size):</span>
                        <span className="w-1/2">____________</span>
                    </div>
                </div>

                <div className="mt-6">
                    <p className="font-bold mb-2">ಒಟ್ಟು ಹೊಂದಿರುವ ಚರಾಸ್ತಿ / ಸ್ಥಿರಾಸ್ತಿಗಳ ವಿವರ (Assets Owned):</p>
                    <table className="w-full border-collapse border border-black text-center text-xs">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="border border-black p-2">ಜಮೀನು (Land Type)</th>
                                <th className="border border-black p-2">ಗ್ರಾಮ (Village)</th>
                                <th className="border border-black p-2">ಸ.ನಂ (Sy No)</th>
                                <th className="border border-black p-2">ಕ್ಷೇತ್ರ (Area)</th>
                                <th className="border border-black p-2">ಆಕಾರ (Assessment)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* Re-use land details if available, else blank rows */}
                            <tr>
                                <td className="border border-black p-2 h-8">ಖುಷ್ಕಿ (Dry)</td>
                                <td className="border border-black p-2">{app.village}</td>
                                <td className="border border-black p-2">{details?.survey_no}</td>
                                <td className="border border-black p-2">{details?.area_acres}</td>
                                <td className="border border-black p-2">{details?.assessment}</td>
                            </tr>
                            <tr>
                                <td className="border border-black p-2 h-8">ತರಿ (Wet)</td>
                                <td className="border border-black p-2"></td>
                                <td className="border border-black p-2"></td>
                                <td className="border border-black p-2"></td>
                                <td className="border border-black p-2"></td>
                            </tr>
                            <tr>
                                <td className="border border-black p-2 h-8">ಬಾಗಾಯ್ತ (Garden)</td>
                                <td className="border border-black p-2"></td>
                                <td className="border border-black p-2"></td>
                                <td className="border border-black p-2"></td>
                                <td className="border border-black p-2"></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="mt-8 space-y-4">
                    <div>
                        <p className="font-bold">3. ಹಾಲಿ ಬೆಳೆಯುತ್ತಿರುವ ವಿವರ (Crops Grown):</p>
                        <div className="border-b border-black border-dotted h-6"></div>
                    </div>
                    <div>
                        <p className="font-bold">4. ನೀರಾವರಿ ಸೌಲಭ್ಯ (Irrigation):</p>
                        <div className="border-b border-black border-dotted h-6"></div>
                    </div>
                    <div>
                        <p className="font-bold">5. ಜಮೀನಿನಿಂದ ಬರುತ್ತಿರುವ ವಾರ್ಷಿಕ ಆದಾಯ (Annual Land Income):</p>
                        <div className="border-b border-black border-dotted h-6"></div>
                    </div>
                </div>
            </div>

            {/* ================= PAGE 6: Income & Liabilities ================= */}
            <div className="w-[210mm] min-h-[297mm] mx-auto p-12 bg-white relative break-before-page text-sm">
                <div className="space-y-6">
                    <div>
                        <p className="font-bold">6. ಇತರೇ ಮೂಲಗಳಿಂದ ಬರುವ ಆದಾಯ (Other Income):</p>
                        <div className="border-b border-black border-dotted h-8"></div>
                    </div>
                    <div>
                        <p className="font-bold">7. ಈಗಾಗಲೆ ಗಳಿಸುತ್ತಿರುವ ವಾರ್ಷಿಕ ಒಟ್ಟು ಆದಾಯ (Total Annual Income):</p>
                        <div className="border-b border-black border-dotted h-8"></div>
                    </div>
                    <div>
                        <p className="font-bold">8. ಈಗಾಗಲೇ ಸಾಲಗಾರರು ಪಡೆದ ಸಾಲಗಳು (Existing Loans):</p>
                        <table className="w-full border-collapse border border-black text-center mt-2">
                            <thead>
                                <tr>
                                    <th className="border border-black p-2">ಸಂಸ್ಥೆಯ ಹೆಸರು (Institution)</th>
                                    <th className="border border-black p-2">ಸಾಲದ ಮೊತ್ತ (Amount)</th>
                                    <th className="border border-black p-2">ಬಾಕಿ (Balance)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="border border-black p-2 h-10"></td>
                                    <td className="border border-black p-2"></td>
                                    <td className="border border-black p-2"></td>
                                </tr>
                                <tr>
                                    <td className="border border-black p-2 h-10"></td>
                                    <td className="border border-black p-2"></td>
                                    <td className="border border-black p-2"></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div>
                        <p className="font-bold">9. ಉದ್ದೇಶಿತ ಯೋಜನೆ (Proposed Scheme):</p>
                        <div className="border-b border-black border-dotted p-2 font-mono text-lg">{app.scheme_type} - Tractor Trailer</div>
                    </div>
                    <div>
                        <p className="font-bold">10. ಸಾಲಗಾರರಿಗೆ ಇರುವ ಅನುಭವ (Experience):</p>
                        <div className="border-b border-black border-dotted h-8"></div>
                    </div>
                </div>
            </div>

            {/* ================= PAGE 7: Security & Verification ================= */}
            <div className="w-[210mm] min-h-[297mm] mx-auto p-12 bg-white relative break-before-page text-sm">
                <h4 className="font-bold text-lg mb-4 underline">ಆಧಾರಕ್ಕೊಳಪಡಿಸುತ್ತಿರುವ ಆಸ್ತಿ ವಿವರ (Security Assets)</h4>
                <div className="border border-black p-4 mb-6">
                    <p className="mb-2 italic text-gray-500">Details of assets offered as security (Same as Asset Table)</p>
                    <table className="w-full border-collapse border border-black text-center text-xs">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="border border-black p-2">ಜಮೀನು / ಆಸ್ತಿ (Asset)</th>
                                <th className="border border-black p-2">ಸರ್ವೆ ನಂಬರು (Sy No)</th>
                                <th className="border border-black p-2">ಅಂದಾಜು ಮೌಲ್ಯ (Est. Value)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="border border-black p-2 h-8">Land</td>
                                <td className="border border-black p-2">{details?.survey_no}</td>
                                <td className="border border-black p-2"></td>
                            </tr>
                            <tr>
                                <td className="border border-black p-2 h-8">House</td>
                                <td className="border border-black p-2"></td>
                                <td className="border border-black p-2"></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="space-y-6">
                    <div>
                        <p className="font-bold">11. ತಪಾಸಣೆ ಸಮಯದಲ್ಲಿ ಸಾಲಗಾರರು ನೀಡಿರುವ ವಿವರಗಳು ಸರಿಯಾಗಿವೆಯೇ? (Verification):</p>
                        <div className="mt-2 flex gap-8">
                            <label className="flex items-center"><span className="w-6 h-6 border border-black mr-2"></span> ಹೌದು (Yes)</label>
                            <label className="flex items-center"><span className="w-6 h-6 border border-black mr-2"></span> ಅಲ್ಲ (No)</label>
                        </div>
                    </div>
                    <div className="border border-black p-4 min-h-[150px]">
                        <p className="font-bold mb-2">ಸ್ಥಳ ಪರಿಶೀಲನಾ ವರದಿ (Site Inspection Report):</p>
                        <div className="h-full border-b border-gray-200"></div>
                    </div>
                </div>
            </div>

            {/* ================= PAGE 8: Recommendations ================= */}
            <div className="w-[210mm] min-h-[297mm] mx-auto p-12 bg-white relative break-before-page text-sm">
                <h3 className="text-xl font-bold text-center underline mb-8">ಪ್ರಾಥಮಿಕ ಬ್ಯಾಂಕಿನ ದೃಢೀಕರಣ ಶಿಫಾರಸ್ಸು (Bank Recommendation)</h3>

                <div className="space-y-8">
                    <div>
                        <p className="font-bold">1. ಯೋಜನೆಯ ಬಗ್ಗೆ ಆರ್ಥಿಕ ಮತ್ತು ತಾಂತ್ರಿಕ ಮಾರ್ಗದರ್ಶನ (Guidance Provided):</p>
                        <div className="border-b border-black border-dotted h-8 mt-2"></div>
                    </div>
                    <div>
                        <p className="font-bold">2. ಯೋಜನೆಯ ವೆಚ್ಚ ಮತ್ತು ಆದಾಯದ ಅಂದಾಜು (Cost & Income Est.):</p>
                        <div className="border-b border-black border-dotted h-8 mt-2"></div>
                    </div>

                    <div className="border-2 border-black p-6 mt-12 bg-gray-50 print:bg-white">
                        <p className="font-bold text-center text-lg mb-8 uppercase underline">ಶಿಫಾರಸ್ಸು (Recommendation)</p>
                        <p className="leading-loose text-justify">
                            ಮೇಲ್ಕಂಡ ಸಾಲಗಾರರಾದ ಶ್ರೀ/ಶ್ರೀಮತಿ <b>{app.applicant_name_kn}</b> ಇವರು ಸಲ್ಲಿಸಿದ ಅರ್ಜಿ ಮತ್ತು ದಾಖಲೆಗಳನ್ನು ಪರಿಶೀಲಿಸಲಾಗಿದೆ.
                            ಸ್ಥಳ ಪರಿಶೀಲನೆಯ ವರದಿಯ ಅನ್ವಯ, ಇವರಿಗೆ ಟ್ರ್ಯಾಕ್ಟರ್ ಯೋಜನೆಯ ಅಡಿಯಲ್ಲಿ ಸಾಲ ಮಂಜೂರು ಮಾಡಲು ಶಿಫಾರಸ್ಸು ಮಾಡುತ್ತೇನೆ.
                        </p>

                        <div className="flex justify-between mt-24">
                            <div className="text-center w-1/3">
                                <div className="border-t border-black pt-1 font-bold">ಕ್ಷೇತ್ರಾಧಿಕಾರಿ (Field Officer)</div>
                            </div>
                            <div className="text-center w-1/3">
                                <div className="border-t border-black pt-1 font-bold">ವ್ಯವಸ್ಥಾಪರು (Manager)</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Placeholder for remainder */}
            <div className="w-[210mm] min-h-[297mm] mx-auto p-12 bg-white relative break-before-page flex flex-col items-center justify-center text-gray-400 border-dashed border-4 border-gray-200">
                <h3 className="text-xl font-bold">Additional Legal Pages (9-23)</h3>
                <p>Standard Bank Terms & Conditions</p>
            </div>
        </div>
    );
};

export default TractorApplicationForm;
