import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.security.MessageDigest;

public class Hwid {
    private static String run(String cmd) {
        try {
            Process p = new ProcessBuilder("powershell", "-NoProfile", "-Command", cmd).start();
            BufferedReader br = new BufferedReader(new InputStreamReader(p.getInputStream()));
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = br.readLine()) != null) sb.append(line);
            return sb.toString().trim();
        } catch (Exception e) {
            return "";
        }
    }

    public static String sha256(String s) throws Exception {
        MessageDigest md = MessageDigest.getInstance("SHA-256");
        byte[] bytes = md.digest(s.getBytes("UTF-8"));
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) sb.append(String.format("%02x", b));
        return sb.toString();
    }

    public static String[] getSignals() {
        String sys = run("(Get-CimInstance Win32_ComputerSystemProduct).UUID");
        String mb = run("(Get-CimInstance Win32_BaseBoard).SerialNumber");
        return new String[]{sys, mb};
    }

    public static String getComposite() throws Exception {
        String[] sig = getSignals();
        String base = (sig[0] == null ? "" : sig[0]) + "|" + (sig[1] == null ? "" : sig[1]);
        return sha256(base);
    }
    public static String buildVerifyPayload(String appName, String appSecret, String licenceKey) throws Exception {
        String sys = run("(Get-CimInstance Win32_ComputerSystemProduct).UUID");
        String mb = run("(Get-CimInstance Win32_BaseBoard).SerialNumber");
        String hwid = sha256((sys == null ? "" : sys) + "|" + (mb == null ? "" : mb));
        StringBuilder sb = new StringBuilder();
        sb.append("{\"appName\":\"").append(appName).append("\",\"appSecret\":\"").append(appSecret)
          .append("\",\"licenceKey\":\"").append(licenceKey).append("\",\"hwid\":\"").append(hwid)
          .append("\",\"system_uuid\":\"").append(sys).append("\",\"motherboard_id\":\"").append(mb).append("\"}");
        return sb.toString();
    }
    public static String buildRuntimePayload(int appId, String appSecret, String licenceKey, String appVersion, String integrityHash) throws Exception {
        String sys = run("(Get-CimInstance Win32_ComputerSystemProduct).UUID");
        String mb = run("(Get-CimInstance Win32_BaseBoard).SerialNumber");
        String hwid = sha256((sys == null ? "" : sys) + "|" + (mb == null ? "" : mb));
        StringBuilder sb = new StringBuilder();
        sb.append("{\"appId\":").append(appId).append(",\"appSecret\":\"").append(appSecret)
          .append("\",\"licenceKey\":\"").append(licenceKey).append("\",\"hwid\":\"").append(hwid)
          .append("\",\"appVersion\":\"").append(appVersion).append("\",\"integrityHash\":\"").append(integrityHash)
          .append("\",\"system_uuid\":\"").append(sys).append("\",\"motherboard_id\":\"").append(mb).append("\"}");
        return sb.toString();
    }
}
