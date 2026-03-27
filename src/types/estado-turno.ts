export type EstadoTurnoTripType = 'B2C' | 'B2B' | 'FLOTA'
export type EstadoTurnoStatus = 1 | 2 | 3 | 4 | 5

export interface EstadoTurnoTrip {
    id: string
    originalType: string
    type: EstadoTurnoTripType
    pkgs: number
    op: string
    etiq: string
    carrier: string
    status: EstadoTurnoStatus
    fecha: string
}
