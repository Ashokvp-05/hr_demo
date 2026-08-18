async function testApi() {
    const payload = {
        companyName: "UI Trigger Corp " + Date.now(),
        adminName: "UI Admin",
        email: "ui-admin-" + Date.now() + "@example.com",
        password: "password123",
        plan: "FREE"
    };

    console.log("Sending payload:", payload);

    try {
        const res = await fetch("http://localhost:4000/api/auth/register-company", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        console.log("Status:", res.status);
        console.log("Response:", data);
    } catch (err) {
        console.error("Fetch Error:", err);
    }
}

testApi();
