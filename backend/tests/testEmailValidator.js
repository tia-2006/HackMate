const { validateEmailDetails, validateEmail } = require('../utils/emailValidator');

const testCases = [
    { email: 'tini@gmail.com', expectedValid: true, label: 'Standard valid email' },
    { email: 'tini_antony@gmail.com', expectedValid: true, label: 'Valid email with underscore' },
    { email: 'tini-antony@sub.domain.edu', expectedValid: true, label: 'Valid email with hyphen and subdomain .edu' },
    { email: 'tin gmail.com', expectedValid: false, label: 'Missing @' },
    { email: 'tini@@gmail.com', expectedValid: false, label: 'Multiple @' },
    { email: '@gmail.com', expectedValid: false, label: 'No text before @' },
    { email: 'tini@', expectedValid: false, label: 'No domain after @' },
    { email: 'tini@gmail', expectedValid: false, label: 'No dot in domain' },
    { email: 'tini@.com', expectedValid: false, label: 'No text between @ and .' },
    { email: 'tini@gmail.', expectedValid: false, label: 'Ends with dot / invalid extension' },
    { email: 'tini antony@gmail.com', expectedValid: false, label: 'Contains spaces' },
    { email: 'tini..antony@gmail.com', expectedValid: false, label: 'Consecutive dots' },
    { email: '.tini@gmail.com', expectedValid: false, label: 'Starts with a dot' },
    { email: 'tini.@gmail.com', expectedValid: false, label: 'Ends username with a dot' },
    { email: 'tini@gm!ail.com', expectedValid: false, label: 'Invalid char in domain (!)' },
    { email: 'tini@gmail@com', expectedValid: false, label: 'Multiple @ in domain' },
    { email: '', expectedValid: false, label: 'Empty email' }
];

let passedCount = 0;
let failedCount = 0;

console.log('--- Running Email Validation Tests ---\n');

testCases.forEach(({ email, expectedValid, label }) => {
    const res = validateEmailDetails(email);
    const pass = res.isValid === expectedValid;
    if (pass) {
        passedCount++;
        console.log(`✅ [PASS] "${email}" (${label}) -> isValid: ${res.isValid} ${res.error ? `[Error: ${res.error}]` : ''}`);
    } else {
        failedCount++;
        console.error(`❌ [FAIL] "${email}" (${label}) -> Expected: ${expectedValid}, Got: ${res.isValid}, Error: ${res.error}`);
    }
});

console.log(`\n--- Summary: ${passedCount}/${testCases.length} passed ---`);
if (failedCount > 0) {
    process.exit(1);
} else {
    console.log('All email validation unit tests passed successfully!\n');
}
