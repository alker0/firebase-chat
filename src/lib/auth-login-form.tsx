import { SignUpForm, emailRegex, passwordRegex } from "@components/cirrus/domain/login-form-group";

export type SignUpSubmit = SignUpForm.Props["onSubmit"]

export const signUpFormComponent = SignUpForm.createComponent({
  itemSize: 'small'
})

export {
  signUpFormComponent as SighUpForm,
  emailRegex,
  passwordRegex
}
