'use client'
import { useState, useEffect, useRef } from 'react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'
import { Calendar } from 'lucide-react'

export default function DatePicker({ value, onChange }) {
  const [show, setShow] = useState(false)
  const wrapperRef = useRef(null)

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShow(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={wrapperRef}>
      {/* Input Field */}
      <div className="relative">
        <input
          type="text"
          readOnly
          value={value ? new Date(value).toLocaleDateString() : ''}
          onClick={() => setShow(!show)}
          className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 pr-10 text-white cursor-pointer"
          placeholder="Select date"
        />
        <Calendar 
          className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" 
          size={18} 
        />
      </div>

      {/* Calendar Popup */}
      {show && (
        <div className="absolute z-50 mt-2 bg-white rounded-lg shadow-xl p-2">
          <DayPicker
            mode="single"
            selected={value ? new Date(value) : undefined}
            onSelect={(date) => {
              if (date) {
                onChange(date.toISOString().split('T')[0])
              }
              setShow(false)
            }}
            styles={{
              caption: { color: 'black' },
              head_cell: { color: 'black' },
              day: { color: 'black' }
            }}
          />
        </div>
      )}
    </div>
  )
}