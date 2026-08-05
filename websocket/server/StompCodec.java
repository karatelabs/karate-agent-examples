
import io.karatelabs.common.Json;
import io.karatelabs.ext.contract.WireCodec;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * A STOMP wire codec as a custom {@link WireCodec} — the worked example that a bespoke protocol rides the
 * codec SPI (no engine change). Encodes {command, headers, body} maps to STOMP frames and parses them
 * back; a JSON-looking body is parsed to a map. (A JS-authored form of this is tracked in BACKLOG — the
 * "no Java compile" theme.)
 */
public class StompCodec implements WireCodec {

    private static final char NUL = '\0';

    @SuppressWarnings("unchecked")
    @Override
    public Object encode(Object value) {
        Map<String, Object> map = (Map<String, Object>) value;
        String command = (String) map.get("command");
        Map<String, Object> headers = (Map<String, Object>) map.get("headers");
        Object body = map.get("body");
        if (body instanceof Map) {
            body = Json.of(body).toString();
        }
        StringBuilder sb = new StringBuilder();
        sb.append(command).append('\n');
        if (headers != null) {
            headers.forEach((k, v) -> sb.append(k).append(':').append(v).append('\n'));
        }
        sb.append('\n');
        if (body != null) {
            sb.append(body);
        }
        sb.append(NUL);
        return sb.toString();
    }

    @Override
    public Object decode(Object wireObj) {
        String wire = String.valueOf(wireObj);
        String trimmed = wire.endsWith(String.valueOf(NUL)) ? wire.substring(0, wire.length() - 1) : wire;
        String[] lines = trimmed.split("\n", -1);
        Map<String, Object> map = new LinkedHashMap<>();
        Map<String, String> headers = new LinkedHashMap<>();
        map.put("command", lines.length > 0 ? lines[0] : "");
        int i = 1;
        for (; i < lines.length; i++) {
            if (lines[i].isEmpty()) {
                i++;
                break;
            }
            int pos = lines[i].indexOf(':');
            if (pos > -1) {
                headers.put(lines[i].substring(0, pos), lines[i].substring(pos + 1));
            }
        }
        map.put("headers", headers);
        StringBuilder body = new StringBuilder();
        for (; i < lines.length; i++) {
            body.append(lines[i]);
        }
        String bodyStr = body.toString().trim();
        if (!bodyStr.isEmpty()) {
            map.put("body", bodyStr.charAt(0) == '{' ? Json.of(bodyStr).asMap() : bodyStr);
        }
        return map;
    }

}
