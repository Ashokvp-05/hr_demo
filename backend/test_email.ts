import { sendLeaveRequestNotification } from './src/services/email.service';

const run = async () => {
    try {
        console.log("Sending test email to ashokvp04@gmail.com...");
        
        // Simulating the "John Smith" example with buttons
        await sendLeaveRequestNotification(
            "ashokvp04@gmail.com",
            "John Smith",
            "Casual Leave",
            "Wed May 07 2026",
            "Thu May 08 2026",
            "http://localhost:3000/api/approve-mock",
            "http://localhost:3000/api/reject-mock"
        );
        
        // Simulating the "Test Employee" example without buttons, coming from Swot Admin
        await sendLeaveRequestNotification(
            "ashokvp04@gmail.com",
            "Test Employee",
            "Sick Leave",
            "2026-05-06",
            "2026-05-07",
            undefined,
            undefined,
            undefined,
            "Swot Admin"
        );

        console.log("Test emails processed! Check your inbox (or console if using MOCK).");
        process.exit(0);
    } catch (error) {
        console.error("Failed to send test email:", error);
        process.exit(1);
    }
};

run();
