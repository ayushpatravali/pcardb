import React from 'react';

/**
 * PDFPageOverlay Component
 * Renders a single PDF page image and overlays dynamic data based on a configuration map.
 * 
 * @param {Object} data - The application data object (flat or nested)
 * @param {Object} pageConfig - Configuration for this specific page (bgImage, fields array)
 * @param {Function} formatDate - Utility to format dates
 */
const PDFPageOverlay = ({ data, pageConfig, formatDate }) => {

    // Helper to traverse dot-notation paths (e.g. "details.survey_no")
    const getValue = (obj, path) => {
        if (!path) return undefined;
        return path.split('.').reduce((acc, part) => acc && acc[part], obj);
    };

    return (
        <div
            className="relative bg-white shadow-lg print:shadow-none print:m-0 break-after-page"
            style={{
                width: '794px', // A4 width @ 96 DPI
                height: '1123px', // A4 height @ 96 DPI
                backgroundImage: `url(${pageConfig.bgImage})`,
                backgroundSize: '100% 100%',
                backgroundRepeat: 'no-repeat',
                margin: '0 auto 20px auto', // Visual margin for screen
                pageBreakAfter: 'always'
            }}
        >
            {pageConfig.fields.map((field, idx) => {
                let value = null;

                // Resolve Value
                if (field.path) {
                    value = getValue(data, field.path);
                } else if (field.key) {
                    value = data[field.key];
                } else if (field.value) {
                    value = field.value; // Static value like "X"
                }

                // Format Date if needed (simple heuristic or explicit flag)
                if (field.key && field.key.includes('date') && value) {
                    value = formatDate ? formatDate(value) : value;
                }

                // Skip simple Empty fields
                if (value === undefined || value === null || value === '') {
                    if (!field.type) return null; // Don't render empty text
                }

                // Style Object
                const style = {
                    position: 'absolute',
                    left: field.x,
                    top: field.y,
                    transform: 'translateY(-50%)', // Center text vertically on the 'y' line
                    fontSize: field.fontSize || '12px',
                    fontWeight: field.fontWeight || 'normal',
                    fontFamily: 'serif', // Match PDF font style
                    color: field.color || '#000',
                    width: field.width || 'auto',
                    height: field.height || 'auto',
                    textAlign: field.textAlign || 'left',
                    whiteSpace: 'nowrap',
                    ...field.style // Allow custom overrides
                };

                // Render Box / Photo Placeholder
                if (field.type === 'box') {
                    return <div key={idx} style={{ ...style, border: field.border || '1px solid black' }}></div>;
                }

                return (
                    <div key={idx} style={style}>
                        {value}
                    </div>
                );
            })}
        </div>
    );
};

export default PDFPageOverlay;
