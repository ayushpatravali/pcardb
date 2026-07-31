# PCARDB Loan Automation - Deployment Plan

## 1. The Deployment Constraints
Based on the client's requirements, the deployment must navigate severe constraints:
1. **No Public Internet:** The application cannot be hosted on public cloud servers (AWS, DigitalOcean). It must remain strictly on the bank's internal network.
2. **Minimal Hardware Resources:** The bank does not have a dedicated server tower. The application must run on an existing, standard desktop machine used by staff.
3. **Hierarchy Requirements (Optional):** The client wants to explore having a Manager see all applications created by Data Entry Operators.

Given these constraints, there are exactly two viable deployment paths.

---

## Path A: Local Intranet Server (Recommended for Hierarchy)

This method involves choosing **one desktop** in the bank to act as the "Host Server", while all other laptops/desktops in the office connect to it via the local Wi-Fi/Ethernet network.

### How It Works
1. **The Host Machine:** We install Python, Node.js, and the SQLite database on the Manager's desktop (or one reliable operator's desktop). 
2. **Running the App:** We start the application on this Host Machine using `host="0.0.0.0"`. This binds the application to the Host Machine's internal IPv4 address (e.g., `192.168.1.15`).
3. **Client Access:** The other 4 operators open Google Chrome and type `http://192.168.1.15:5173` into the URL bar. They are now using the application hosted on the Host Machine.

### Data Storage & Hierarchy
- **The Database:** There is only **one** database (`database.db`), which physically lives on the hard drive of the Host Machine. 
- **Hierarchy/Visibility:** Because all 5 computers are interacting with the exact same database on the Host Machine, **Data Sharing is inherently solved.** If an Operator submits an application from Laptop 2, the Manager on the Host Machine can instantly click "Refresh" and see that application in their dashboard. 
- **PDF Generation:** When an Operator on Laptop 2 clicks "Download PDF", the Host Machine processes the Excel automation, generates the PDF, and sends the file over Wi-Fi back to Laptop 2, where it is downloaded to Laptop 2's local `Downloads` folder.
- **Constraints:** 
  - The Host Machine **MUST remain powered on**. If it goes to sleep or is turned off, the entire application goes down for everyone else in the office.
  - The IP Address of the Host Machine might change if the Wi-Fi router reboots (DHCP). We would need to set a Static IP for the Host Machine on the router.

---

## Path B: Standalone Desktop Executable (.exe)

If keeping one computer powered on 24/7 as a Host Server is impossible, or if the Wi-Fi network is highly unstable, we must fall back to a Standalone Executable approach.

### How It Works
1. **Packaging:** We use tools like `PyInstaller` (for the Python backend) and `Electron` or `Tauri` (for the React frontend) to package the entire application into a single `PCARDB_App.exe` file.
2. **Installation:** We copy this `.exe` file onto a USB drive and manually install it on all 5 computers individually.
3. **Usage:** Operators double-click the `.exe` icon on their desktop. The app opens like a normal Windows program (like Microsoft Word).

### Data Storage & Hierarchy
- **The Database:** Every single computer creates its own isolated, local `database.db` file on its own hard drive.
- **Hierarchy/Visibility (DEFEATED):** Because each computer has its own database, **there is absolutely zero data sharing.** Laptop 1 cannot see what Laptop 2 created. The Manager cannot see what the Operators are doing. There is no central source of truth.
- **PDF Generation:** PDFs are generated entirely locally and saved directly to that specific computer's hard drive.
- **Constraints:** 
  - To consolidate data at the end of the day, operators would literally have to copy their generated PDFs onto a USB drive and hand them to the Manager. 

## Conclusion & Recommendation
If the client strictly requires **Manager Visibility and Data Consolidation**, you **must** use **Path A (Local Intranet Server)**. It is technically very easy to setup (just finding the IPv4 address and opening a firewall port on the Host Machine), but requires the behavioral discipline of never turning off the Host Machine during work hours.

If the client is okay with sacrificing Manager Visibility in exchange for ultimate simplicity and no Wi-Fi dependency, we can pursue **Path B (Standalone Executable)**.
