(function() {
    window.validationRegex = {
        name: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s']+$/,
        alphanumeric: /^[a-zA-Z0-9_]+$/,
        email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        phone: /^[0-9]{10}$/,
        password: /.{8,}/,
        number: /^[0-9]+$/,
        price: /^[0-9]+(\.[0-9]{1,2})?$/,
        text: /.+/,
        harmful: /[<>"'`{};()/\\]|--|\/\*|\*\/|script|marquee/i
    };

    window.validateInput = (inputElement, regex, errorMessage, allowEmpty = false) => {
        if (!inputElement) return true;

        const value = inputElement.value.trim();
        let errorElement = null;
        
        const parentGroup = inputElement.closest('.form-group');
        if (parentGroup) {
            errorElement = parentGroup.querySelector('.error-text');
        }
        
        if (!errorElement) {
            const parentForm = inputElement.closest('form');
            if (parentForm) {
                errorElement = parentForm.querySelector('.error-text');
            }
        }

        if (!errorElement) return true;

        let isValid = true;
        let msg = '';

        if (!allowEmpty && value === '') {
            msg = 'Este campo es obligatorio.';
            isValid = false;
        } else if (value !== '' && window.validationRegex.harmful.test(value)) {
             msg = 'Caracteres no permitidos detectados.';
             isValid = false;
        } else if (value !== '' && regex && !regex.test(value)) {
            msg = errorMessage;
            isValid = false;
        }

        if (!isValid) {
            inputElement.classList.add('is-invalid');
            errorElement.textContent = msg;
            errorElement.style.display = 'block';
        } else {
            inputElement.classList.remove('is-invalid');
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        }
        return isValid;
    };

    window.addValidationListeners = (inputElement, regex, message, allowEmpty = false) => {
        if (inputElement) {
             inputElement.addEventListener('blur', () => {
                 window.validateInput(inputElement, regex, message, allowEmpty);
             });
             inputElement.addEventListener('input', () => {
                 if (inputElement.classList.contains('is-invalid')) {
                     window.validateInput(inputElement, regex, message, allowEmpty);
                 }
             });
        }
    };

})();