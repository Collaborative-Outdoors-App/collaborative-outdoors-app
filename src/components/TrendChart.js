import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

const GREEN = '#2F5D46';

const INITIAL_SPACING = 10;
const END_SPACING = 50; 
const TOOLTIP_WIDTH = 110;
const TOOLTIP_HEIGHT = 52;
const CHART_HEIGHT = 220;
const Y_TITLE_WIDTH = 24;

export default function TrendChart({
  data,
  yAxisTitle = 'Kilometres',
  unit = 'km',
  hideDataPoints = false,
}) {
  const { width } = useWindowDimensions();

  const chartWidth = width - 40 - 32 - 40 - Y_TITLE_WIDTH;

  // Fit all points exactly between the initial and end spacing
  const spacing =
    (chartWidth - INITIAL_SPACING - END_SPACING) / (data.length - 1 || 1);

  return (
    <View style={styles.card}>
      <View style={styles.chartRow}>
        {/* Y axis title */}
        <View style={styles.yTitleWrap}>
          <Text style={styles.yTitle} numberOfLines={1}>
            {yAxisTitle}
          </Text>
        </View>

        <LineChart
          data={data}
          width={chartWidth}
          height={CHART_HEIGHT}
          initialSpacing={INITIAL_SPACING}
          endSpacing={END_SPACING}
          spacing={spacing}
          curved
          curvature={0.08} // gentler curve so it doesn't dip below zero
          areaChart
          isAnimated
          animationDuration={600}
          color={GREEN}
          thickness={3}
          startFillColor={GREEN}
          endFillColor={GREEN}
          startOpacity={0.3}
          endOpacity={0.02}
          hideDataPoints={hideDataPoints}
          dataPointsColor={GREEN}
          dataPointsRadius={4}
          noOfSections={4}
          yAxisThickness={0}
          xAxisColor="#E5E7EB"
          xAxisLabelsHeight={0} // no x labels, so don't reserve space for them
          rulesColor="#EEF0EF"
          yAxisTextStyle={styles.axisText}
          pointerConfig={{
            pointerStripColor: GREEN,
            pointerStripWidth: 2,
            pointerColor: GREEN,
            radius: 6,
            pointerLabelWidth: TOOLTIP_WIDTH,
            pointerLabelHeight: TOOLTIP_HEIGHT,
            activatePointersOnLongPress: false,
            autoAdjustPointerLabelPosition: true,
            pointerLabelComponent: (items) => (
              <View style={styles.tooltip}>
                <Text style={styles.tooltipDate}>{items[0].date}</Text>
                <Text style={styles.tooltipValue}>
                  {items[0].value} {unit}
                </Text>
              </View>
            ),
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  yTitleWrap: {
    width: Y_TITLE_WIDTH,
    height: CHART_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yTitle: {
    width: 100, // wide enough that the text doesn't wrap before rotating
    textAlign: 'center',
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    transform: [{ rotate: '-90deg' }],
  },
  axisText: {
    fontSize: 11,
    color: '#6B7280',
  },
  tooltip: {
    width: TOOLTIP_WIDTH,
    backgroundColor: GREEN,
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tooltipDate: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    marginBottom: 2,
  },
  tooltipValue: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
});