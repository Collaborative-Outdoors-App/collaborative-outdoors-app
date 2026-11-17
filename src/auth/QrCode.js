import { useMemo } from 'react';
import { View } from 'react-native';
import qrcode from 'qrcode-generator';

export default function QrCode({ value, size = 190 }) {
  const { n, rows } = useMemo(() => {
    const qr = qrcode(0, 'M');
    qr.addData(value);
    qr.make();
    const count = qr.getModuleCount();
    const out = [];
    for (let r = 0; r < count; r++) {
      const runs = [];
      let c = 0;
      while (c < count) {
        if (qr.isDark(r, c)) {
          const start = c;
          while (c < count && qr.isDark(r, c)) c++;
          runs.push({ start, len: c - start });
        } else {
          c++;
        }
      }
      out.push(runs);
    }
    return { n: count, rows: out };
  }, [value]);

  const cell = Math.max(1, Math.floor(size / n));
  const px = cell * n;

  return (

    <View style={{ backgroundColor: '#fff', padding: 12, borderRadius: 12 }}>
      <View style={{ width: px, height: px }}>
        {rows.map((runs, r) => (
          <View key={r} style={{ height: cell, width: px }}>
            {runs.map((run) => (
              <View
                key={run.start}
                style={{
                  position: 'absolute',
                  left: run.start * cell,
                  width: run.len * cell,
                  height: cell,
                  backgroundColor: '#000',
                }}
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}