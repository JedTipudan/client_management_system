// Add admin emails here
export const adminEmails = [
  'ronnelpaciano.1986@gmail.com',
  // Add more admin emails here
]

export const isAdmin = (email: string | undefined) => {
  if (!email) return false
  return adminEmails.includes(email.toLowerCase())
}