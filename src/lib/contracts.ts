import { Abi } from 'viem'
import sshManagerAbi from './ssh-manager-abi.json'
import { CONTRACT_ADDRESSES, xLayerTestnet } from './web3-config'

export const SSH_MANAGER_ABI = sshManagerAbi as Abi

export const getContractAddress = (chainId: number = xLayerTestnet.id) => {
  return CONTRACT_ADDRESSES.SSH_MANAGER[chainId as keyof typeof CONTRACT_ADDRESSES.SSH_MANAGER]
}

export const SSH_MANAGER_CONTRACT = {
  address: getContractAddress(),
  abi: SSH_MANAGER_ABI,
} as const