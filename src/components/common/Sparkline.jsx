import { Box, useTheme } from '@mui/material';
import { ResponsiveContainer, LineChart, Line } from 'recharts';

// Tiny trend line for a stat tile — no axes, no chrome.
export default function Sparkline({ data, color, height = 32 }) {
  const theme = useTheme();
  const rows = (data || []).map((v, i) => ({ i, v }));
  if (rows.length < 2) return null;
  return (
    <Box sx={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 3, bottom: 3, left: 0, right: 0 }}>
          <Line
            type="monotone"
            dataKey="v"
            stroke={color || theme.palette.chart.sequential[3]}
            strokeWidth={1.75}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
}
