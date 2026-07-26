import { Pressable, StyleSheet, Text, View } from 'react-native';

interface BudgetProgressCardProps {
  /** The label shown for the budget category or goal. */
  title: string;
  /** The maximum budget amount allowed for this category. */
  budget: number;
  /** The amount already spent against the budget. */
  spent: number;
  /** Called when the card is pressed. */
  onPress?: () => void;
  /** Called when the spending exceeds the configured budget. */
  onBudgetExceeded?: () => void;
}

export default function BudgetProgressCard({
  title,
  budget,
  spent,
  onPress,
  onBudgetExceeded,
}: BudgetProgressCardProps) {
  const percentage = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
  const remaining = Math.max(budget - spent, 0);
  const exceeded = spent > budget;

  if (exceeded && onBudgetExceeded) {
    onBudgetExceeded();
  }

  return (
    <Pressable style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text>{percentage.toFixed(0)}%</Text>
      </View>

      <View style={styles.allocatedRow}>
        <Text style={styles.allocatedLabel}>Allocated budget</Text>
        <Text style={styles.allocatedValue}>LKR {budget.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</Text>
      </View>

      <View style={styles.track}>
        <View style={[styles.progress, { width: `${percentage}%` }]} />
      </View>

      <Text>Spent: LKR {spent.toFixed(2)}</Text>
      <Text>Remaining: LKR {remaining.toFixed(2)}</Text>

      {exceeded ? <Text style={styles.warning}>Budget exceeded</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  allocatedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  allocatedLabel: {
    color: '#68756F',
    fontSize: 12,
  },
  allocatedValue: {
    color: '#0F9D58',
    fontWeight: '700',
    fontSize: 13,
  },
  track: {
    height: 10,
    backgroundColor: '#F7F8FA',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progress: {
    height: '100%',
    backgroundColor: '#0F9D58',
  },
  warning: {
    marginTop: 8,
    color: '#D32F2F',
    fontWeight: '600',
  },
});
