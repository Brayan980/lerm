# **App Name**: LERM Evaluator

## Core Features:

- Login Authentication: User authentication with role-based access control (Admin, Evaluator, Assistant) using provided credentials. The system checks the credentials against hardcoded values to grant access.
- Data Entry UI: Displays a user interface for entering client's personal data: names, surnames, date of birth (calculating age in decimals), email, and ID number, and consent to data collection/processing.
- Terms and Conditions: Consent and Agreement: display of three bodies of text in collapsible fieldsets, covering (1) consent to data collection/processing, (2) details regarding physical assessment, and (3) purpose of data collection. Agreement via mandatory checkbox.
- Age-Based Form Routing: Dynamic Form Redirection: Upon form submission, the application calculates the user's age based on the entered birth date, and then redirects the user to a specific questionnaire form appropriate for the age range. Carries forward user-provided data.
- Display PAR-Q Form: Presents the PAR-Q (Physical Activity Readiness Questionnaire) form to users, regardless of age. This form gathers health-related information and emergency contacts.  Upon submission of the form the system stores the entered details, calculates the IPAQ, assesses the fitness levels and renders them on screen for confirmation.
- IPAQ Form: Displays an interactive questionnaire regarding users' levels of physical activity.  Includes conditional logic to adapt to different answers and pre-calculates physical exertion metrics based on the form.

## Style Guidelines:

- Primary color: Dark royal blue (#395098), inspired by the academic nature of the content; conveying seriousness and professionalism without being dull.
- Background color: Light gray (#e3e5ea), to create a clean, neutral backdrop that contrasts with the primary color, but is not stark white.
- Accent color: Soft violet (#a280c9), analogous to the primary blue but lighter and desaturated, to provide subtle contrast for interactive elements and highlights.
- Body font: 'PT Sans', a humanist sans-serif with a modern look and a little warmth or personality; good for both headlines and body text.