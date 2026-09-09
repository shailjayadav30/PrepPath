import { StyleSheet, Text, View } from 'react-native'
import { useLocalSearchParams } from 'expo-router';

const roadmap = () => {
    const { id } = useLocalSearchParams(); 
  return (
    <View>
      <Text>roadmap {id}</Text>
    </View>
  )
}

export default roadmap

const styles = StyleSheet.create({})