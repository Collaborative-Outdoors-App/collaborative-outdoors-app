import { forwardRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '../styles/theme';

const TextField = forwardRef(function TextField({ label, error, secure = false, inputStyle, ...inputProps }, ref) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(secure);

  return (
    <View style={styles.field}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.box, focused && styles.boxFocused, !!error && styles.boxError]}>
        <TextInput
          ref={ref}
          style={[styles.input, inputStyle]}
          placeholderTextColor={colors.stone}
          secureTextEntry={hidden}
          autoCorrect={false}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...inputProps}
        />
        {secure ? (
          <Pressable
            onPress={() => setHidden((h) => !h)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
          >
            <Text style={styles.toggle}>{hidden ? 'Show' : 'Hide'}</Text>
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
});

export default TextField;

const styles = StyleSheet.create({
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: colors.stone },
  box: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: 14,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
  },
  boxFocused: { borderColor: colors.primary },
  boxError: { borderColor: colors.danger },
  input: { flex: 1, height: '100%', fontSize: 16, color: colors.ink },
  toggle: { fontSize: 14, fontWeight: '600', color: colors.primary },
  error: { fontSize: 13, color: colors.danger },
});
