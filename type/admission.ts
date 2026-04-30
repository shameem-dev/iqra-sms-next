// admisstion register section for new admission

export type AdmissionRecord = {
  id?: number
  admission_no: string
  name: string
  standard: string
  date_of_birth: string
  aadhar_no: string
  parent_guardian: string
  address: string
  mobile_no: string
  vehicle_point?: string
  created_at?: string
  user_id?: string
  gender: string  
}

