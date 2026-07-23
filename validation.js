document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('application-form');
    if (!form) return;

    const fields = [
        { id: 'fullName', name: 'Full Name', validate: val => val.trim().length >= 2 },
        { id: 'email', name: 'Business Email', validate: val => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) },
        { id: 'company', name: 'Company Name', validate: val => val.trim().length >= 2 },
        { id: 'industry', name: 'Industry Sector', validate: val => val !== '' },
        { id: 'service', name: 'Service Line', validate: val => val !== '' },
        { id: 'terms', name: 'Terms & Privacy Agreement', isCheckbox: true, validate: checked => checked }
    ];

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        let isValid = true;

        fields.forEach(field => {
            const input = document.getElementById(field.id);
            const errorElem = document.getElementById(`${field.id}-error`);
            const value = field.isCheckbox ? input.checked : input.value;

            if (!field.validate(value)) {
                isValid = false;
                input.classList.add('border-rose-500');
                if (errorElem) {
                    errorElem.textContent = field.isCheckbox 
                        ? 'You must accept the terms to proceed.' 
                        : `Please enter a valid ${field.name.toLowerCase()}.`;
                    errorElem.classList.remove('hidden');
                }
            } else {
                input.classList.remove('border-rose-500');
                if (errorElem) {
                    errorElem.classList.add('hidden');
                }
            }
        });

        if (isValid) {
            document.getElementById('success-alert').classList.remove('hidden');
            form.reset();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });
});