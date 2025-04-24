import React from 'react'
import logoImg from '../app/logo.png'

const TopBar = () => {
  return (
    <div className='w-full bg-textBlack h-10'>
        <img src={logoImg.src} alt="" />
    </div>
  )
}

export default TopBar