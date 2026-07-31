export const TRACTOR_MAP = {
    pages: [
        {
            pageNum: 1,
            bgImage: '/assets/forms/tractor/tractor_p1.png',
            width: 794, // A4 width at 96dpi (approx)
            height: 1123,
            fields: [
                // Header (Bank Name, etc. are static)

                // Applicant Details
                { key: 'applicant_name_kn', x: '45%', y: '28%', fontSize: '14px', fontWeight: 'bold' }, // Name
                { key: 'father_name_kn', x: '45%', y: '32%', fontSize: '12px' },

                // Example of calculated composite fields
                { key: 'age', x: '45%', y: '36%', fontSize: '12px' },
                { key: 'caste', x: '45%', y: '39%', fontSize: '12px' },

                // Address - multi-line simulation
                { key: 'village', x: '45%', y: '43%', fontSize: '12px' },
                { key: 'taluk', x: '65%', y: '43%', fontSize: '12px' },

                // Photo Placeholder (special type)
                { type: 'box', x: '75%', y: '15%', width: '15%', height: '12%', border: '1px solid #ccc' }
            ]
        },
        {
            pageNum: 2,
            bgImage: '/assets/forms/tractor/tractor_p2.png',
            fields: [
                // Land Details Table Row 1
                { key: 'village', x: '15%', y: '25%', fontSize: '10px' },
                { key: 'survey_no', path: 'details.survey_no', x: '30%', y: '25%', fontSize: '10px' },
                { key: 'area_acres', path: 'details.area_acres', x: '50%', y: '25%', fontSize: '10px' },
                { key: 'land_assessment', path: 'details.assessment', x: '70%', y: '25%', fontSize: '10px' },

                // Loan Request
                { key: 'loan_amount', x: '60%', y: '60%', fontSize: '14px', fontWeight: 'bold' }
            ]
        },
        {
            pageNum: 3,
            bgImage: '/assets/forms/tractor/tractor_p3.png',
            fields: [
                // Checklist - X marks
                { key: 'check_rtc', value: 'X', x: '80%', y: '30%', fontSize: '14px' }
                // ... more checks
            ]
        },
        {
            pageNum: 8, // Using p8 image as the 4th view page
            bgImage: '/assets/forms/tractor/tractor_p8.png',
            fields: [
                { key: 'applicant_name_kn', x: '30%', y: '55%', fontSize: '12px' }
            ]
        }
    ]
};
