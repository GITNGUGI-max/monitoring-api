Monitoring API
A Node.js and Express application that reports its health, process uptime, and memory usage, and saves HTTP request logs. Deployed on an Ubuntu AWS EC2 instance and managed by systemd.
Features
- GET /health returns the application's status as JSON.
- GET /metrics returns the current Node.js process's uptime and resident memory usage.
- Middleware logs completed requests with UTC timestamps, HTTP methods, paths, and response status codes.
- Request logs are printed to the console and appended to request.log.
- Startup errors are logged and cause an unsuccessful process exit.
- A systemd service enables startup at boot and automatic recovery after failures.
Requirements
- Node.js 24 LTS and npm.
- Git.
- An Ubuntu EC2 instance with systemd for the deployment steps.
- Python 3 for the JSON formatting commands shown below.
The EC2 deployment was tested with Node.js v24.22.1 and npm 11.19.1.
Run locally
git clone https://github.com/GITNGUGI-max/monitoring-api.git
cd monitoring-api
npm ci
npm start
Open http://localhost:3001/health or http://localhost:3001/metrics.

npm ci installs the dependency versions recorded in package-lock.json. npm start runs server.js.
Endpoints
Method	Path	Response
GET	/health	Application status and service name.
GET	/metrics	Process uptime in seconds and resident memory in megabytes.


Example health response:
{
  "status": "Ok",
  "service": "Monitoring-API"
}
Example metrics response captured on EC2:
{
  "uptime_seconds": 25,
  "memory_rss_mb": 69.28
}
Measurements describe the current Node.js process. One megabyte is 1,000,000 bytes. Uptime resets when the process restarts, and memory usage varies over time.
Request logs
Each completed request produces a line such as:
2026-10-27T07:35:04.130Z | GET | /metrics | 200
The timestamp is UTC; Z indicates UTC. Requests are appended to request.log in the application's working directory. A log file is created when the first request is logged.

On Linux or Git Bash, inspect the last five entries with:
tail -n 5 request.log
The .gitignore rules exclude node_modules, generated .log files, and local .env settings from source control.
Deploy on EC2
Connect to the Ubuntu instance using SSH. With Node.js 24 active, install the application:
cd /home/ubuntu
git clone https://github.com/GITNGUGI-max/monitoring-api.git
cd monitoring-api
npm ci --omit=dev
command -v node
The command -v node output identifies the executable to use in the service definition. This deployment used /home/ubuntu/.nvm/versions/node/v24.22.1/bin/node.

If testing with npm start in the foreground, stop that process with Ctrl+C before starting the systemd service.

Create the service definition:
sudo nano /etc/systemd/system/monitoring-api.service
The following configuration matches the verified deployment. On another installation, use that installation's Node executable path and application directory.
[Unit]
Description=Monitoring API
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/monitoring-api
ExecStart=/home/ubuntu/.nvm/versions/node/v24.22.1/bin/node /home/ubuntu/monitoring-api/server.js
Environment=NODE_ENV=production
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
Load the definition, enable startup at boot, and start the API:
sudo systemctl daemon-reload
sudo systemctl enable --now monitoring-api.service
systemctl show monitoring-api.service \
  -p ActiveState -p SubState -p MainPID -p UnitFileState
The expected state is active/running, with a nonzero MainPID and UnitFileState=enabled. The service runs independently of an interactive SSH session.
Verify the EC2 deployment
Run these commands inside an SSH session on the EC2 instance. Here, 127.0.0.1 refers to that instance.
curl -fsS http://127.0.0.1:3001/health | python3 -m json.tool
curl -fsS http://127.0.0.1:3001/metrics | python3 -m json.tool
Python's json.tool formats and validates each JSON response.

Inspect service output and the request log:
sudo journalctl -u monitoring-api.service -n 20 --no-pager
tail -n 5 /home/ubuntu/monitoring-api/request.log
Verify automatic recovery
This test simulates a crash of the API's main process. With the configured restart policy, systemd should start a replacement process after approximately five seconds.

Record the current process ID and restart count:
systemctl show monitoring-api.service -p MainPID -p NRestarts
Simulate the failure and allow recovery time:
sudo systemctl kill --kill-whom=main --signal=SIGKILL monitoring-api.service
sleep 6
Check the new process and endpoint:
systemctl show monitoring-api.service \
  -p ActiveState -p SubState -p MainPID -p NRestarts
curl -fsS http://127.0.0.1:3001/metrics | python3 -m json.tool
Expected results: active/running state, a different MainPID, NRestarts increased by one, and a valid metrics response with a fresh uptime.
Recorded recovery test — 27 October 2026
Check	Observed result
Main process ID	Changed from 1982448 to 1988515.
Automatic restart count	NRestarts=1 after the controlled failure.
Service state	ActiveState=active and SubState=running.
Metrics response	Valid JSON; uptime 25 seconds and RSS memory 69.28 MB at the recorded check.


Diagnose startup problems
Inspect the service and recent logs:
sudo systemctl status monitoring-api.service --no-pager
sudo journalctl -u monitoring-api.service -n 20 --no-pager
If another process is using port 3001, identify it:
sudo ss -ltnp 'sport = :3001'
Check its command and working directory before stopping it. Stop a manually started copy with Ctrl+C in its original terminal, then start the service.

The app.listen callback checks for startup errors, logs the error message, sets process.exitCode to 1, and returns. This lets systemd's on-failure policy detect a failed startup.
Update the deployment
After committing and pushing application changes from the development computer:
git -C /home/ubuntu/monitoring-api pull --ff-only
cd /home/ubuntu/monitoring-api
npm ci --omit=dev
sudo systemctl restart monitoring-api.service
When changing the installed Node.js version, update ExecStart to the new executable path. After editing the service definition, run daemon-reload before restarting the service.
Skills practised
Node.js, Express, HTTP, JSON, middleware, process metrics, asynchronous file operations, Git/GitHub, Linux processes and logs, AWS EC2, and systemd service management.
References
- Node.js release support
- nvm installation and usage
- Express application API
- systemd service configuration