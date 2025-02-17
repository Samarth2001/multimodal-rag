'use client';
import { Message } from '../context/ChatContext';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

export default function ChatMessage({ message }: { message: Message }) {
  return (
    <div className={`message ${message.isUser ? 'user' : 'ai'}`}>
      {message.images?.map((img, i) => (
        <Image 
          key={i}
          src={`data:image/jpeg;base64,${img}`}
          width={500}
          height={300}
          className="doc-image"
          alt={`Document visual ${i+1}`}
        />
      ))}
    </div>
  )
}