import { FeratelClientAPIWrapper } from './FeratelClientAPIWrapper.js';
import readline from 'readline';

const apiClient = new FeratelClientAPIWrapper();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function printCommands() {
    console.log("Welcome to the Feratel Client API CLI!");
    console.log("Available commands:");
    console.log("1. login");
    console.log("2. getUserProfile");
    console.log("3. getNewMessages");
    console.log("4. getPreCheckIn <checkInId>");
    console.log("5. approvePreCheckIn <checkInId>");
    console.log("6. convertCheckInToRegistrationForm <checkInId>");
    console.log("7. getGuestCardsForCheckIn <checkInId>");
    console.log("8. sendGuestCardsForCheckIn <checkInId>");
    console.log("9. deleteRegistration <checkInId>");
    console.log("10. help - Print available commands");
    console.log("Type 'exit' to quit.");
}

printCommands();

const handleCommand = async (command) => {
    const [cmd, arg] = command.split(' ');

    switch (cmd) {
        case 'login':
            rl.question("Enter username: ", (username) => {
                rl.question("Enter password: ", (password) => {
                    rl.question("Enter orgId: ", async (orgId) => {
                        console.log("Logging in...");
                        await apiClient.login(username, password, orgId);
                        console.log("Login successful.");
                        rl.prompt();
                    });
                });
            });
            break;

        case 'getUserProfile':
            console.log("Fetching user profile...");
            const profile = await apiClient.getUserProfiel();
            console.log("User Profile:", profile);
            break;

        case 'getNewMessages':
            console.log("Fetching new messages...");
            const messages = await apiClient.getNewMessages();
            console.log("New Messages:", messages);
            break;

        case 'getPreCheckIn':
            if (!arg) {
                console.log("Please provide a checkInId.");
                break;
            }
            console.log(`Fetching pre-check-in data for ID: ${arg}...`);
            const preCheckInData = await apiClient.getPreCheckIn(arg);
            console.log("Pre Check-In Data:", preCheckInData);
            break;

        case 'approvePreCheckIn':
            if (!arg) {
                console.log("Please provide a checkInId.");
                break;
            }
            console.log(`Approving pre-check-in for ID: ${arg}...`);
            const approval = await apiClient.approvePreCheckIn(arg);
            console.log("Approval Response:", approval);
            break;

        case 'convertCheckInToRegistrationForm':
            if (!arg) {
                console.log("Please provide a checkInId.");
                break;
            }
            console.log(`Converting check-in ID: ${arg} to registration form...`);
            console.log("This feature is not yet implemented.");
            break;

        case 'getGuestCardsForCheckIn':
            if (!arg) {
                console.log("Please provide a checkInId.");
                break;
            }
            console.log(`Fetching guest cards for check-in ID: ${arg}...`);
            const guestCards = await apiClient.getGuestCardsForCheckIn(arg);
            console.log("Guest Cards:", guestCards);
            break;

        case 'deleteRegistration':
            if (!arg) {
                console.log("Please provide a checkInId.");
                break;
            }
            console.log(`Deleting registration for check-in ID: ${arg}...`);
            const deleteResponse = await apiClient.deleteRegistration(arg);
            console.log("Delete Response:", deleteResponse);
            break;

        case 'help':
            printCommands();
            break;

        case 'sendGuestCardsForCheckIn':
            if (!arg) {
                console.log("Please provide a checkInId.");
                break;
            }
            console.log(`Sending guest cards for check-in ID: ${arg}...`);
            console.log("This feature is not yet implemented.");
            break;
        
        case 'exit':
            console.log("Exiting...");
            rl.close();
            return;

        default:
            console.log("Unknown command. Please try again.");
    }

    rl.prompt();
};

rl.on('line', handleCommand);
rl.prompt();
